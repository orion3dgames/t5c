import { Serializer } from "./Serializer";
export declare class NoneSerializer<T = any> implements Serializer<T> {
    setState(rawState: any): void;
    getState(): any;
    patch(patches: any): void;
    teardown(): void;
    handshake(bytes: number[]): void;
}
