import { Serializer } from "./Serializer";
import { Schema, Iterator } from "@colyseus/schema";
export type SchemaConstructor<T = Schema> = new (...args: any[]) => T;
export declare class SchemaSerializer<T extends Schema = any> implements Serializer<T> {
    state: T;
    setState(rawState: any): import("@colyseus/schema").DataChange<any, string>[];
    getState(): T;
    patch(patches: any): import("@colyseus/schema").DataChange<any, string>[];
    teardown(): void;
    handshake(bytes: number[], it?: Iterator): void;
}
