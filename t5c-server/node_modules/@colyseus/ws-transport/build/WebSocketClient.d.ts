import WebSocket from 'ws';
import { Client, ClientState, ISendOptions } from '@colyseus/core';
export declare class WebSocketClient implements Client {
    id: string;
    ref: WebSocket;
    sessionId: string;
    state: ClientState;
    _enqueuedMessages: any[];
    _afterNextPatchQueue: any;
    _reconnectionToken: string;
    constructor(id: string, ref: WebSocket);
    sendBytes(type: string | number, bytes: number[] | Uint8Array, options?: ISendOptions): void;
    send(messageOrType: any, messageOrOptions?: any | ISendOptions, options?: ISendOptions): void;
    enqueueRaw(data: ArrayLike<number>, options?: ISendOptions): void;
    raw(data: ArrayLike<number>, options?: ISendOptions, cb?: (err?: Error) => void): void;
    error(code: number, message?: string, cb?: (err?: Error) => void): void;
    get readyState(): 0 | 1 | 2 | 3;
    leave(code?: number, data?: string): void;
    close(code?: number, data?: string): void;
    toJSON(): {
        sessionId: string;
        readyState: 0 | 1 | 2 | 3;
    };
}
