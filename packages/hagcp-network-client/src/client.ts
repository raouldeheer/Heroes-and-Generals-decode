import { EventEmitter } from "events";
import { Socket, createConnection } from "net";
import { createHash, createHmac } from "crypto";
import { BufferCursor } from "hagcp-utils";
import { ClassKeys, keyToClass, ResponseType } from "./protolinking/classKeys";
import { ProtoToString } from "./protoclasses/proto";
import { gunzipSync } from "zlib";
import { appendFileSync, writeFileSync } from "fs";
import fetch from "node-fetch";

interface Settings {
    web_entrance: string[];
    account_url: string;
    flash_dynhttp: string[];
    hngtitle: string;
    distribution: string;
    retoxdistribution: string;
    version: string;
    releasename: string;
    ircserver: string;
    uniqueversionfilename: string;
    unique_file_server1: string;
    unique_file_server2: string;
    unique_file_servers: string;
    uniqueflashfile: string;
    tileserver: string;
    locale_cs: string;
    locale_de: string;
    locale_en: string;
    locale_es: string;
    locale_fr: string;
    locale_pl: string;
    locale_ru: string;
    locale_tr: string;
    locale_pt: string;
    locale_zh: string;
    locale_ko: string;
    locale_ja: string;
    lang_string: string;
    sitetrackerid: string;
    extensionid: string;
}

export class Client extends EventEmitter {
    private con: Socket;
    private idNumber;
    private rest: Buffer | undefined;
    public connected: boolean;

    private constructor(
        host: string,
        port: number,
        private readonly userAgent: string,
        private readonly userName: string,
        private readonly password: string
    ) {
        super();
        this.connected = false;
        this.idNumber = 0;
        this.con = createConnection({ host, port });

        this.con.on("close", err => {
            this.connected = false;
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
            this.connected = true;
            writeFileSync("./testConLog.txt", "", "utf8");
            // connected to server with tcp
            this.sendPacket(ClassKeys.QueryServerInfo);
        });
    }

    /**
     * connectToHQ creates a client and checks server status.
     * @param userAgent the useragent that is used.
     * @param userName the username of the user to connect with.
     * @param password the password of the user.
     * @returns a new client
     */
    public static async connectToHQ(userAgent: string, userName: string, password: string) {
        const status = await fetch("http://game.heroesandgenerals.com/status");
        if (status.status !== 200) {
            console.log(`status.status: ${status.status}`);
            return null;
        }

        const items = (await (await fetch("http://game.heroesandgenerals.com/settings.js")).text())
            .split(";\r\n")
            .filter(e => e)
            .map(e => e.split("="))
            .reduce<Settings>((prev: any, curr) => {
                if (curr[1].includes(",")) {
                    prev[curr[0]] = curr[1].substring(1, curr[1].length - 1).split(",");
                } else {
                    prev[curr[0]] = curr[1].substring(1, curr[1].length - 1);
                }
                return prev;
            }, {} as Settings);

        const randomServer = items.web_entrance[Math.floor(Math.random() * items.web_entrance.length)];
        console.log(randomServer);

        const [host, port] = randomServer.split(":");
        return new this(host, Number(port), userAgent, userName, password);
    }

    public close() {
        this.connected = false;
        try { this.con.end().destroy(); } catch (_) { }
    }

    public sendPacket(className: ClassKeys, payload?: any, callback?: (result: any) => void): boolean {
        // Get data from class.
        const buffer = keyToClass.get(className)?.toBuffer?.(payload);
        // If class doesn't return any data, return failed.
        if (!buffer) return false;
        // Get total length of packet.
        const totalLength = buffer.byteLength + className.length;
        // Construct BufferCursor.
        const result = new BufferCursor(Buffer.allocUnsafe(20 + totalLength));
        result.writeUInt32LE(20 + totalLength);             // Write TotalLen.
        result.writeUInt32LE(8);                            // Write IDLen.
        result.writeUInt32LE(++this.idNumber);              // Write ID.
        // Set listener for callback.
        if (callback) this.once(`id${this.idNumber}`, callback);
        result.writeUInt32LE(8 + totalLength);              // Write Size.
        result.writeUInt32LE(4 + className.length);         // Write HLen.
        result.write(className, className.length, "ascii"); // Write Header.
        result.writeBuff(buffer, buffer.byteLength);        // Write Data.
        this.con.write(result.buffer);  // Write packet to tcp.
        return true;                    // Return success.
    }

    public sendPacketAsync<T = any>(className: ClassKeys, payload?: any): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            try {
                this.sendPacket(className, payload, (result) => {
                    resolve(result);
                });
            } catch (error) {
                reject(error);
            }
        });
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
        // Decoded sessionid.
        const sessionid = Buffer.from(tempSessionid, "base64");
        // Concat buffers and createHash.
        const sha1concat = (d1: Buffer, d2: Buffer) =>
            createHash("sha1").update(Buffer.concat([d1, d2])).digest();
        // Create loginHash.
        const loginkeyhash = sha1concat(sha1concat(
            Buffer.from(password, "latin1"),
            Buffer.from(salt, "base64")
        ), sessionid);

        return {
            // Create Hmac with encryptedSessionkey and loginhash.
            digest: createHmac("sha1", Buffer.from(encryptedSessionkey, "base64")
                .map((value, i) => value ^ loginkeyhash[i % loginkeyhash.length]))
                .update(sessionid)
                .digest("base64"),
            tempSessionid,
        };
    }

    private handleMessage(data: Buffer) {
        const element = new BufferCursor(data);
        const plen = element.readUInt32LE();
        if (plen !== data.byteLength) console.log(`${plen} !== ${data.byteLength}`);
        element.move(4);
        const id = element.readUInt32LE();

        const size = element.readUInt32LE() - 4;
        const typeLength = element.readUInt32LE() - 4;
        const typeText = element.slice(typeLength).toString() as ClassKeys;
        if (size - typeLength == 4) return;

        const DataBuf = element.slice();
        const DataLen = DataBuf.readUInt32LE() - 4;
        DataBuf.seek(0);

        let result;
        if (keyToClass.has(typeText)) {
            // Find class to parse packet with.
            const klas = keyToClass.get(typeText)!;
            result = klas.parse(DataBuf) as any;
            switch (typeText) {
                case "zipchunk":
                    if (typeof result == "function") {
                        this.handleMessage(gunzipSync(result().data));
                        return;
                    }
                    break;
                case "QueryServerInfoResponse":
                    this.sendPacket(ClassKeys.QueryBannedMachineRequest);
                    break;
                case "QueryBannedMachineResponse":
                    if (result.isBanned) {
                        console.error("Player banned");
                        this.close();
                    } else {
                        this.sendPacket(ClassKeys.StartLogin);
                    }
                    break;
                case "LoginQueueUpdate":
                    this.emit("LoginQueueUpdate", result.positionInQueue);
                    console.info(`Queue: ${result.positionInQueue}`);
                    if (result.mayProceed) this.sendPacket(ClassKeys.login2_begin, {
                        username: this.userName,
                        deviceid: this.userAgent,
                        acceptingPrivacyPolicy: false,
                        acceptingBattlEyePolicy: false,
                    });
                    break;
                case "login2_challenge":
                    this.sendPacket(ClassKeys.login2_response, this.login(this.password, result));
                    break;
                case "login2_result":
                    this.emit("login2_result", result);
                    if (result.response == ResponseType.login_success) {
                        this.emit("loggedin");
                    } else {
                        console.log("Login failed!!!");
                        this.emit("loginFailed");
                    }
                    break;
                case "keepaliverequest":
                    // TODO Find out what 8374 means.
                    this.sendPacket(ClassKeys.keepalive, { value: 8374 });
                    break;
                default:
                    this.emit("message", typeText, result);
                    this.emit(typeText, result);
                    this.emit(`id${id}`, result);
                    break;
            }
            if (typeof result == "object") result = ProtoToString(result);
        } else {
            console.log(`unsupported message: ${typeText}`);
        }

        const startString = `${plen.toString().padEnd(5)} ${id.toString().padEnd(5)} ${typeText.padEnd(35)}`;
        const midString = `${DataLen.toString().padEnd(5)}`;
        const outputStr = `${startString} ${result ? result : midString}`;
        // console.log(outputStr);
        appendFileSync("./testConLog.txt", outputStr + "\n", "utf8");
    }
}
