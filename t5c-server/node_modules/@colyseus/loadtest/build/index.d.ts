export type RequestJoinOperations = {
    requestNumber?: number;
};
export type Options = {
    endpoint: string;
    roomName: string;
    roomId: string;
    numClients: number;
    delay: number;
    logLevel: string;
    reestablishAllDelay: number;
    retryFailed: number;
    output: string;
    requestJoinOptions?: RequestJoinOperations;
};
export type MainCallback = (options: Options) => Promise<void>;
export declare function cli(main: MainCallback): void;
