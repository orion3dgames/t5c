import { SchemaDecoderCallbacks } from "../Schema";
import { DataChange } from "..";
import { ChangeTree } from "../changes/ChangeTree";
export declare function getMapProxy(value: MapSchema): MapSchema<any, string>;
export declare class MapSchema<V = any, K extends string = string> implements Map<K, V>, SchemaDecoderCallbacks {
    protected $changes: ChangeTree;
    protected $items: Map<K, V>;
    protected $indexes: Map<number, K>;
    protected $refId: number;
    $callbacks: {
        [operation: number]: Array<(item: V, key: string) => void>;
    };
    onAdd(callback: (item: V, key: string) => void, triggerAll?: boolean): () => boolean;
    onRemove(callback: (item: V, key: string) => void): () => boolean;
    onChange(callback: (item: V, key: string) => void): () => boolean;
    static is(type: any): boolean;
    constructor(initialValues?: Map<K, V> | Record<K, V>);
    /** Iterator */
    [Symbol.iterator](): IterableIterator<[K, V]>;
    get [Symbol.toStringTag](): string;
    static get [Symbol.species](): typeof MapSchema;
    set(key: K, value: V): this;
    get(key: K): V | undefined;
    delete(key: K): boolean;
    clear(changes?: DataChange[]): void;
    has(key: K): boolean;
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void;
    entries(): IterableIterator<[K, V]>;
    keys(): IterableIterator<K>;
    values(): IterableIterator<V>;
    get size(): number;
    protected setIndex(index: number, key: K): void;
    protected getIndex(index: number): K;
    protected getByIndex(index: number): V;
    protected deleteByIndex(index: number): void;
    toJSON(): any;
    clone(isDecoding?: boolean): MapSchema<V>;
}
