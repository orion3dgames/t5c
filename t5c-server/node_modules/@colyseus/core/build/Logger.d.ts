export declare class Logger {
    debug(...args: any[]): void;
    error(...args: any[]): void;
    info(...args: any[]): void;
    trace(...args: any[]): void;
    warn(...args: any[]): void;
}
export declare let logger: Logger;
export declare function setLogger(instance: Logger): void;
