import { EventEmitter } from "events";
import net from "net";
import crypto from 'crypto';
import BufferCursor from "./buffercursor";
import { keys } from "./types";
import { password } from "./env";
import { ProtoToString } from "./proto";
import { gunzipSync } from "zlib";
import { appendFileSync, writeFileSync } from "fs";

export class Client extends EventEmitter {
    con: net.Socket;
    private idNumber;
    private rest: Buffer | undefined;
    constructor(host: string, port: number) {
        super();
        this.idNumber = 0;
        this.con = net.createConnection({ host, port });

        this.con.on("close", err => {
            console.log(`closed and ${err ? "had" : "no"} error`);
            this.emit("closed");
        });

        this.con.on("error", console.error);

        this.con.on("data", (data: Buffer) => {
            if (!this.rest) {
                this.rest = data;
            } else {
                const tmp = Buffer.allocUnsafe(this.rest.length + data.length);
                this.rest.copy(tmp, 0);
                data.copy(tmp, this.rest.length);
                this.rest = tmp;
            }
            while (this.rest && this.rest.length > 4) {
                const len = this.rest.readUInt32LE(0);
                if (this.rest.length >= len) {
                    this.handleMessage(this.rest.slice(0, len));
                    this.rest = this.rest.slice(len);
                } else break;
            }
        });

        this.con.on("connect", () => {
            writeFileSync("./testConLog.txt", "", "utf8");
            // connected to server with tcp
            this.sendPacketToBuffer("QueryServerInfo");
        });
    }

    public close() {
        try {
            this.con.end();
            this.con.destroy();
        } catch (_) { }
    }

    private packer(className: string, data: Buffer) {
        const totalLength = data.byteLength + className.length;
        const result = new BufferCursor(Buffer.allocUnsafe(20 + totalLength));
        result.writeUInt32LE(20 + totalLength);
        result.writeUInt32LE(8);
        result.writeUInt32LE(++this.idNumber);
        result.writeUInt32LE(8 + totalLength);
        result.writeUInt32LE(4 + className.length);
        result.write(className, className.length, "ascii");
        result.writeBuff(data, data.byteLength);
        return result.buffer;
    }

    public sendPacketToBuffer(className: string, payload?: any) {
        const buffer = keys.get(className)?.toBuffer?.(payload);
        if (!buffer) return false;
        this.con.write(this.packer(className, buffer));
        return true;
    }

    private login(
        password: string,
        {
            salt,
            tempSessionid,
            encryptedSessionkey,
        }: {
            salt: string,
            tempSessionid: string,
            encryptedSessionkey: string,
        }
    ) {
        const sessionid = Buffer.from(tempSessionid, "base64");

        const sha1concat = (d1: Buffer, d2: Buffer) =>
            crypto.createHash('sha1').update(Buffer.concat([d1, d2])).digest();

        const loginkeyhash = sha1concat(sha1concat(
            Buffer.from(password, "latin1"),
            Buffer.from(salt, "base64")
        ), sessionid);

        const computeHMAC = (key: crypto.BinaryLike, data: crypto.BinaryLike) =>
            crypto.createHmac('sha1', key).update(data).digest("base64");

        const digest = computeHMAC(
            Buffer.from(encryptedSessionkey, "base64")
                .map((value, i) => value ^ loginkeyhash[i % loginkeyhash.length]),
            sessionid);

        return {
            digest,
            tempSessionid,
        };
    }

    private handleMessage(data: Buffer) {
        const element = new BufferCursor(data);
        const plen = element.readUInt32LE().toString().padEnd(5);
        element.move(4);
        const id = element.readUInt32LE().toString().padEnd(5);

        const size = element.readUInt32LE() - 4;
        const typeLength = element.readUInt32LE() - 4;
        const typeText = element.slice(typeLength).toString();
        if (size - typeLength == 4) return;

        const DataBuf = element.slice();
        const DataLen = DataBuf.readUInt32LE() - 4;
        DataBuf.seek(0);

        let result;
        if (keys.has(typeText)) {
            // Find class to parse packet with.
            const klas = keys.get(typeText)!;
            result = klas.parse(DataBuf) as any;
            switch (typeText) {
                case "zipchunk":
                    if (typeof result == "function") {
                        this.handleMessage(gunzipSync(result().data));
                        return;
                    }
                    break;
                case "QueryServerInfoResponse":
                    this.sendPacketToBuffer("QueryBannedMachineRequest");
                    break;
                case "QueryBannedMachineResponse":
                    if (result.isBanned) {
                        this.close();
                        console.error("Player banned");
                    } else {
                        this.sendPacketToBuffer("StartLogin");
                    }
                    break;
                case "LoginQueueUpdate":
                    console.info(`Queue: ${result.positionInQueue}`);
                    if (result.mayProceed) {
                        this.sendPacketToBuffer("login2_begin");
                    }
                    break;
                case "login2_challenge":
                    this.sendPacketToBuffer("login2_response", this.login(password, result));
                    break;
                case "login2_result":
                    this.emit("loggedin");
                    break;
                case "keepaliverequest":
                    this.sendPacketToBuffer("keepalive", { value: 8374 });
                    break;
                default:
                    this.emit(typeText, result);
                    this.emit("message", typeText, result);
                    break;
            }

            if (typeof result == "object") {
                result = ProtoToString(result);
            }
        } else {
            console.log(`unsupported message: ${typeText}`);
        }

        const startString = `${plen} ${id} ${typeText.padEnd(35)}`;
        const midString = `${DataLen.toString().padEnd(5)}`;
        const outputStr = `${startString} ${result
            ? result // Print bytes when class didn't give any results.
            : midString
            }`;
        console.log(outputStr);
        appendFileSync("./testConLog.txt", outputStr+"\n", "utf8");
    }
}
