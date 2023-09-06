import { ChangeTree } from "../changes/ChangeTree";
import { SchemaDecoderCallbacks } from "../Schema";
import { DataChange } from "..";
export declare class SetSchema<V = any> implements SchemaDecoderCallbacks {
    protected $changes: ChangeTree;
    protected $items: Map<number, V>;
    protected $indexes: Map<number, number>;
    protected $refId: number;
    $callbacks: {
        [operation: number]: Array<(item: V, key: string) => void>;
    };
    onAdd(callback: (item: V, key: string) => void, triggerAll?: boolean): () => boolean;
    onRemove(callback: (item: V, key: string) => void): () => boolean;
    onChange(callback: (item: V, key: string) => void): () => boolean;
    static is(type: any): boolean;
    constructor(initialValues?: Array<V>);
    add(value: V): number | false;
    entries(): IterableIterator<[number, V]>;
    delete(item: V): boolean;
    clear(changes?: DataChange[]): void;
    has(value: V): boolean;
    forEach(callbackfn: (value: V, key: number, collection: SetSchema<V>) => void): void;
    values(): IterableIterator<V>;
    get size(): number;
    protected setIndex(index: number, key: number): void;
    protected getIndex(index: number): number;
    protected getByIndex(index: number): V;
    protected deleteByIndex(index: number): void;
    toArray(): V[];
    toJSON(): V[];
    clone(isDecoding?: boolean): SetSchema<V>;
}
