export declare enum Platform {
    ios = "ios",
    android = "android"
}
export interface Device {
    id: string;
    platform: Platform;
}
export interface IStatus {
    status: boolean;
}
export interface IUser {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isAnonymous: boolean;
    email: string;
    lang: string;
    location: string;
    timezone: string;
    metadata: any;
    devices: Device[];
    facebookId: string;
    twitterId: string;
    googleId: string;
    gameCenterId: string;
    steamId: string;
    friendIds: string[];
    blockedUserIds: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class Auth implements IUser {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isAnonymous: boolean;
    email: string;
    lang: string;
    location: string;
    timezone: string;
    metadata: any;
    devices: Device[];
    facebookId: string;
    twitterId: string;
    googleId: string;
    gameCenterId: string;
    steamId: string;
    friendIds: string[];
    blockedUserIds: string[];
    createdAt: Date;
    updatedAt: Date;
    token: string;
    protected endpoint: string;
    protected keepOnlineInterval: any;
    constructor(endpoint: string);
    get hasToken(): boolean;
    login(options?: {
        accessToken?: string;
        deviceId?: string;
        platform?: string;
        email?: string;
        password?: string;
    }): Promise<this>;
    save(): Promise<this>;
    getFriends(): Promise<IUser[]>;
    getOnlineFriends(): Promise<IUser[]>;
    getFriendRequests(): Promise<IUser[]>;
    sendFriendRequest(friendId: string): Promise<IStatus>;
    acceptFriendRequest(friendId: string): Promise<IStatus>;
    declineFriendRequest(friendId: string): Promise<IStatus>;
    blockUser(friendId: string): Promise<IStatus>;
    unblockUser(friendId: string): Promise<IStatus>;
    request(method: 'get' | 'post' | 'put' | 'del', segments: string, query?: {
        [key: string]: number | string;
    }, body?: any, headers?: {
        [key: string]: string;
    }): Promise<any>;
    logout(): void;
    registerPingService(timeout?: number): void;
    unregisterPingService(): void;
}
