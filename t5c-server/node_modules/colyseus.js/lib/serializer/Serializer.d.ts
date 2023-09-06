export interface Serializer<State> {
    setState(data: any): void;
    getState(): State;
    patch(data: any): void;
    teardown(): void;
    handshake?(bytes: number[], it?: any): void;
}
export declare function registerSerializer(id: string, serializer: any): void;
export declare function getSerializer(id: string): any;
