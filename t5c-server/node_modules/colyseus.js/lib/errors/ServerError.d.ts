export declare enum CloseCode {
    CONSENTED = 4000,
    DEVMODE_RESTART = 4010
}
export declare class ServerError extends Error {
    code: number;
    constructor(code: number, message: string);
}
