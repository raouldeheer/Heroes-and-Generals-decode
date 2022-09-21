import { EventEmitter } from "events";
import { BufferCursor } from "hagcp-utils";
import { Socket as NetSocket } from "net";
import { gunzip } from "zlib";
import { ProtoToString } from "./protoclasses/proto";
import { ClassKeys } from "./protolinking/classKeys";
import { PacketClass, PacketClassKeys, packetClassParser } from "./protolinking/linking";

export interface Socket {
    on(event: "connect", listener: () => void): this;
    on(event: "close", listener: () => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    on<ClassType extends PacketClassKeys>(event: ClassType, listener: (result: ReturnType<(typeof PacketClass)[ClassType]["parse"]>) => void): this;
    on<ClassType extends PacketClassKeys>(event: "message", listener: (typeText: ClassType, result: ReturnType<(typeof PacketClass)[ClassType]["parse"]>) => void): this;

    once(event: "connect", listener: () => void): this;
    once(event: "close", listener: () => void): this;
    once(event: "error", listener: (error: Error) => void): this;
    once<ClassType extends PacketClassKeys>(event: ClassType, listener: (result: ReturnType<(typeof PacketClass)[ClassType]["parse"]>) => void): this;
    once<ClassType extends PacketClassKeys>(event: "message", listener: (typeText: ClassType, result: ReturnType<(typeof PacketClass)[ClassType]["parse"]>) => void): this;

    off(event: "connect", listener: () => void): this;
    off(event: "close", listener: () => void): this;
    off(event: "error", listener: (error: Error) => void): this;
    off<ClassType extends PacketClassKeys>(event: ClassType, listener: (result: ReturnType<(typeof PacketClass)[ClassType]["parse"]>) => void): this;
    off<ClassType extends PacketClassKeys>(event: "message", listener: (typeText: ClassType, result: ReturnType<(typeof PacketClass)[ClassType]["parse"]>) => void): this;
}

export class Socket extends EventEmitter {
    private idNumber;
    private rest: Buffer | undefined;
    public connected: boolean;
    constructor(
        private readonly con: NetSocket,
        private readonly isDebug: boolean
    ) {
        super();
        this.connected = false;
        this.idNumber = 0;

        this.con.on("close", err => {
            this.connected = false;
            console.log(`closed and ${err ? "had" : "no"} errors`);
            if (err) console.error(err);
            this.emit("close");
        });

        this.con.on("error", error => {
            if (error.message.includes("ECONNRESET")) {
                this.con.destroy();
                this.connected = false;
                this.emit("close");
            } else {
                console.error(error);
                this.emit("error", error);
            }
        });

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
            this.emit("connect");
        });
    }

    /**
     * sendClass sends a packet to the server
     * @param packetClass class to send
     * @param payload payload to send
     * @param callback callback for response
     * @returns true if sending was succesfull
     */
    public sendClass<
        T extends packetClassParser,
        RType
    >(
        packetClass: T,
        payload?: Parameters<T["toBuffer"]>[0],
        callback?: (result: RType) => void,
    ): boolean {
        // If class doesn't exist, return failed.
        if (!packetClass) return false;
        if (this.isDebug) console.log(`sending: ${packetClass.name}`);
        const buffer = packetClass.toBuffer(payload);
        // Get total length of packet.
        const totalLength = buffer.byteLength + packetClass.name.length;
        // Construct BufferCursor.
        const result = new BufferCursor(Buffer.allocUnsafe(20 + totalLength));
        result.writeUInt32LE(20 + totalLength);             // Write TotalLen.
        result.writeUInt32LE(8);                            // Write IDLen. //! Id is limited to UInt32 here
        result.writeUInt32LE(++this.idNumber);              // Write ID.
        // Set listener for callback.
        // @ts-expect-error id${this.idNumber} is not an exported type of the EventEmitter
        if (callback) this.once(`id${this.idNumber}`, callback);
        result.writeUInt32LE(8 + totalLength);              // Write Size.
        result.writeUInt32LE(4 + packetClass.name.length);         // Write HLen.
        result.write(packetClass.name, packetClass.name.length, "ascii"); // Write Header.
        result.writeBuff(buffer, buffer.byteLength);        // Write Data.
        this.con.write(result.buffer);  // Write packet to tcp.
        return true;                    // Return success.
    }

    /**
     * sendPacket sends a packet to the server
     * @param className name of class to send
     * @param payload payload to send
     * @param callback callback for response
     * @returns true if sending was succesfull
     */
    public sendPacket<
        ClassType extends PacketClassKeys,
        IType = Parameters<(typeof PacketClass)[ClassType]["toBuffer"]>[0],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        RType = any
    >(
        className: ClassType,
        payload?: IType,
        callback?: (result: RType) => void,
    ): boolean {
        // Get packetClass from list
        const packetClass = Reflect.get(PacketClass, className);
        // Send packet with packetClass
        return this.sendClass(packetClass, payload, callback);
    }

    /**
     * sendAsync sends a packet to the server and return a promise with the data of the response packet
     * @param className name of class to send
     * @param payload payload to send
     * @returns data of response packet
     */
    public sendPacketAsync<InputType, ReturnType>(className: ClassKeys, payload?: InputType): Promise<ReturnType> {
        return new Promise((resolve, reject) => {
            try {
                if (!this.sendPacket(className, payload, resolve))
                    throw new Error("Packet not send, class was probably not found");
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * handleMessage handles incoming messages
     * @param data rawBuffer of response
     */
    private handleMessage(data: Buffer): void {
        const element = new BufferCursor(data);
        const plen = element.readUInt32LE();
        // Check if tcpPacket length is correct
        if (plen !== data.byteLength) console.log(`${plen} !== ${data.byteLength}`);
        element.move(4); //! Id is limited to UInt32 here
        const id = element.readUInt32LE();

        // Get size of packet
        const size = element.readUInt32LE() - 4;
        const typeLength = element.readUInt32LE() - 4;
        // Parse typeClassName
        const typeText = element.slice(typeLength).toString() as ClassKeys;
        // Return if no data is present
        if (size - typeLength == 4) return;

        // Slice data part of rawBuffer
        const DataBuf = element.slice();
        const DataLen = DataBuf.readUInt32LE() - 4;
        DataBuf.seek(0);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let result: any;
        if (Reflect.has(PacketClass, typeText)) {
            // Find class to parse packet with.
            const klas = Reflect.get(PacketClass, typeText);
            result = klas.parse(DataBuf);
            if (typeText === ClassKeys.zipchunk) {
                gunzip(result.data, (err, data) => {
                    if (err) console.error(err);
                    else this.handleMessage(data);
                });
            } else {
                this.emit("message", typeText, result);
                this.emit(typeText, result);
                this.emit(`id${id}`, result);
            }
            if (typeof result == "object") result = ProtoToString(result);
        } else {
            console.log(`unsupported message: ${typeText}`);
        }

        if (this.isDebug && typeText !== ClassKeys.zipchunk) {
            const startString = `${plen.toString().padEnd(5)} ${id.toString().padEnd(5)} ${typeText.padEnd(35)}`;
            const midString = `${DataLen.toString().padEnd(5)}`;
            const outputStr = `${startString} ${result ? result : midString}`;
            console.log(outputStr);
        }
    }

    /**
     * Close connection
     */
    public close() {
        this.connected = false;
        try { this.con.end().destroy(); } catch (_) { /**/ }
    }
}
