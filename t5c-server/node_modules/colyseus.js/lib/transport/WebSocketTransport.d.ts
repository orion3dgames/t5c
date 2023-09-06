import NodeWebSocket from "ws";
import { ITransport, ITransportEventMap } from "./ITransport";
export declare class WebSocketTransport implements ITransport {
    events: ITransportEventMap;
    ws: WebSocket | NodeWebSocket;
    protocols?: string | string[];
    constructor(events: ITransportEventMap);
    send(data: ArrayBuffer | Array<number>): void;
    connect(url: string): void;
    close(code?: number, reason?: string): void;
    get isOpen(): boolean;
}
