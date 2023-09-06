import { Room, RoomAvailable } from './Room';
import { SchemaConstructor } from './serializer/SchemaSerializer';
export type JoinOptions = any;
export declare class MatchMakeError extends Error {
    code: number;
    constructor(message: string, code: number);
}
export interface EndpointSettings {
    hostname: string;
    secure: boolean;
    port?: number;
    pathname?: string;
}
export declare class Client {
    protected settings: EndpointSettings;
    constructor(settings?: string | EndpointSettings);
    joinOrCreate<T>(roomName: string, options?: JoinOptions, rootSchema?: SchemaConstructor<T>): Promise<Room<T>>;
    create<T>(roomName: string, options?: JoinOptions, rootSchema?: SchemaConstructor<T>): Promise<Room<T>>;
    join<T>(roomName: string, options?: JoinOptions, rootSchema?: SchemaConstructor<T>): Promise<Room<T>>;
    joinById<T>(roomId: string, options?: JoinOptions, rootSchema?: SchemaConstructor<T>): Promise<Room<T>>;
    /**
     * Re-establish connection with a room this client was previously connected to.
     *
     * @param reconnectionToken The `room.reconnectionToken` from previously connected room.
     * @param rootSchema (optional) Concrete root schema definition
     * @returns Promise<Room>
     */
    reconnect<T>(reconnectionToken: string, rootSchema?: SchemaConstructor<T>): Promise<Room<T>>;
    getAvailableRooms<Metadata = any>(roomName?: string): Promise<RoomAvailable<Metadata>[]>;
    consumeSeatReservation<T>(response: any, rootSchema?: SchemaConstructor<T>, reuseRoomInstance?: Room): Promise<Room<T>>;
    protected createMatchMakeRequest<T>(method: string, roomName: string, options?: JoinOptions, rootSchema?: SchemaConstructor<T>, reuseRoomInstance?: Room): Promise<Room<T>>;
    protected createRoom<T>(roomName: string, rootSchema?: SchemaConstructor<T>): Room<T>;
    protected buildEndpoint(room: any, options?: any): string;
    protected getHttpEndpoint(segments?: string): string;
    protected getEndpointPort(): string;
}
