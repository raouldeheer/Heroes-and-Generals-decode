import { IKeyValueChangeSetResult, BufferCursor, bytesToString, splitInGroups, prefixJoin } from "hagcp-utils";
import { bufFromDecodedProto, BufToDecodedProto } from "./proto";
import { KeyValueOp, KeyProtoSet } from "../protolinking/keyValueSet";

export class KeyValueChangeSet {
    static parse(buf: BufferCursor) {
        const returnObj: IKeyValueChangeSetResult = {};
        const groups = splitInGroups(buf);
        groups.forEach(group => {
            const sections = splitInGroups(group);
            switch (bytesToString(sections[0])) {
                case KeyValueOp.set:
                    if (!returnObj.set) returnObj.set = [];
                    sections.shift();
                    for (let i = 0; i < sections.length; i++) {
                        const [keyBuf, valueBuf] = splitInGroups(sections[i]);
                        const key = bytesToString(keyBuf);
                        valueBuf.seek(4);
                        const value = valueBuf.slice().buffer;
                        if (KeyProtoSet.has(key)) {
                            const proto = KeyProtoSet.get(key)!;
                            const decoded = BufToDecodedProto(proto, value);
                            returnObj.set.push({
                                key,
                                value: decoded,
                            });
                        } else {
                            console.log(`New set key: ${key}`);
                            returnObj.set.push({
                                key,
                                value: "New set key",
                            });
                        }
                    }
                    break;
                case KeyValueOp.delete:
                    if (!returnObj.delete) returnObj.delete = [];
                    sections.shift();
                    for (let i = 0; i < sections.length; i++) {
                        const [keyBuf, valueBuf] = splitInGroups(sections[i]);
                        valueBuf.seek(4);
                        returnObj.delete.push({
                            key: bytesToString(keyBuf),
                            value: valueBuf.readBigUint64LE().toString(),
                        });
                    }
                    break;
                default:
                    console.log(bytesToString(sections[0]));
                    break;
            }
        });
        return returnObj;
    }
    static toBuffer(payload: IKeyValueChangeSetResult): Buffer {
        if (!payload.set) return Buffer.alloc(0);
        return prefixJoin([
            prefixJoin([
                Buffer.from(KeyValueOp.set, "utf8"),
                ...payload.set.map(({ key, value }) => {
                    if (KeyProtoSet.has(key)) {
                        const proto = KeyProtoSet.get(key)!;
                        const encoded = bufFromDecodedProto(proto, value);
                        const result = new BufferCursor(Buffer.allocUnsafe(encoded.byteLength + key.length + 12));
                        result.writeUInt32LE(key.length + 4);
                        result.write(key, key.length);
                        result.writeUInt32LE(encoded.byteLength + 8);
                        result.writeUInt32LE(encoded.byteLength + 4);
                        result.writeBuff(encoded, encoded.length);
                        return result.buffer;
                    }
                    return Buffer.allocUnsafe(0);
                }).filter(e => e.length !== 0)
            ])
        ]);
    }
}
