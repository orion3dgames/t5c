import { RoomListingData } from './interfaces';
export declare class RoomCache implements RoomListingData {
    clients: number;
    locked: boolean;
    private: boolean;
    maxClients: number;
    metadata: any;
    name: string;
    publicAddress: string;
    processId: string;
    roomId: string;
    createdAt: Date;
    unlisted: boolean;
    private $rooms;
    constructor(initialValues: any, rooms: RoomCache[]);
    save(): void;
    updateOne(operations: any): void;
    remove(): void;
}
