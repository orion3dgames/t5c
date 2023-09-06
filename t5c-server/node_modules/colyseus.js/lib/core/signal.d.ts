type FunctionParameters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any ? P : never;
export declare class EventEmitter<CallbackSignature extends (...args: any[]) => any> {
    handlers: Array<CallbackSignature>;
    register(cb: CallbackSignature, once?: boolean): this;
    invoke(...args: FunctionParameters<CallbackSignature>): void;
    invokeAsync(...args: FunctionParameters<CallbackSignature>): Promise<any[]>;
    remove(cb: CallbackSignature): void;
    clear(): void;
}
export declare function createSignal<CallbackSignature extends (...args: any[]) => void | Promise<any>>(): {
    once: (cb: CallbackSignature) => void;
    remove: (cb: CallbackSignature) => void;
    invoke: (...args: FunctionParameters<CallbackSignature>) => void;
    invokeAsync: (...args: FunctionParameters<CallbackSignature>) => Promise<any[]>;
    clear: () => void;
} & ((this: any, cb: CallbackSignature) => EventEmitter<CallbackSignature>);
export {};
