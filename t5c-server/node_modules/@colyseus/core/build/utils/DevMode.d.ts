import debug from "debug";
import type { Room } from "../Room";
export declare const debugDevMode: debug.IDebugger;
export declare let isDevMode: boolean;
export declare function setDevMode(bool: boolean): void;
export declare function reloadFromCache(): Promise<void>;
export declare function cacheRoomHistory(rooms: {
    [roomId: string]: Room;
}): Promise<void>;
export declare function getPreviousProcessId(hostname: any): Promise<string>;
export declare function getRoomRestoreListKey(): string;
export declare function getProcessRestoreKey(): string;
