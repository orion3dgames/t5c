import { ChangeTree } from "../changes/ChangeTree";
import { OPERATION } from "../spec";
import { SchemaDecoderCallbacks } from "../Schema";
import { addCallback, removeChildRefs } from "./utils";
import { DataChange } from "..";

type K = number; // TODO: allow to specify K generic on MapSchema.

export class CollectionSchema<V=any> implements SchemaDecoderCallbacks {
    protected $changes: ChangeTree = new ChangeTree(this);

    protected $items: Map<number, V> = new Map<number, V>();
    protected $indexes: Map<number, number> = new Map<number, number>();

    protected $refId: number = 0;

    //
    // Decoding callbacks
    //
    public $callbacks: { [operation: number]: Array<(item: V, key: string) => void> };
    public onAdd(callback: (item: V, key: string) => void, triggerAll: boolean = true) {
        return addCallback(
            (this.$callbacks || (this.$callbacks = [])),
            OPERATION.ADD,
            callback,
            (triggerAll)
                ? this.$items
                : undefined
        );
    }
    public onRemove(callback: (item: V, key: string) => void) { return addCallback(this.$callbacks || (this.$callbacks = []), OPERATION.DELETE, callback); }
    public onChange(callback: (item: V, key: string) => void) { return addCallback(this.$callbacks || (this.$callbacks = []), OPERATION.REPLACE, callback); }

    static is(type: any) {
        return type['collection'] !== undefined;
    }

    constructor (initialValues?: Array<V>) {
        if (initialValues) {
            initialValues.forEach((v) => this.add(v));
        }
    }

    add(value: V) {
        // set "index" for reference.
        const index = this.$refId++;

        const isRef = (value['$changes']) !== undefined;
        if (isRef) {
            (value['$changes'] as ChangeTree).setParent(this, this.$changes.root, index);
        }

        this.$changes.indexes[index] = index;

        this.$indexes.set(index, index);
        this.$items.set(index, value);

        this.$changes.change(index);

        return index;
    }

    at(index: number): V | undefined {
        const key = Array.from(this.$items.keys())[index];
        return this.$items.get(key);
    }

    entries() {
        return this.$items.entries();
    }

    delete(item: V) {
        const entries = this.$items.entries();

        let index: K;
        let entry: IteratorResult<[number, V]>;
        while (entry = entries.next()) {
            if (entry.done) { break; }

            if (item === entry.value[1]) {
                index = entry.value[0];
                break;
            }
        }

        if (index === undefined) {
            return false;
        }

        this.$changes.delete(index);
        this.$indexes.delete(index);

        return this.$items.delete(index);
    }

    clear(changes?: DataChange[]) {
        // discard previous operations.
        this.$changes.discard(true, true);
        this.$changes.indexes = {};

        // clear previous indexes
        this.$indexes.clear();

        //
        // When decoding:
        // - enqueue items for DELETE callback.
        // - flag child items for garbage collection.
        //
        if (changes) {
            removeChildRefs.call(this, changes);
        }

        // clear items
        this.$items.clear();

        this.$changes.operation({ index: 0, op: OPERATION.CLEAR });

        // touch all structures until reach root
        this.$changes.touchParents();
    }

    has (value: V): boolean {
        return Array.from(this.$items.values()).some((v) => v === value);
    }

    forEach(callbackfn: (value: V, key: K, collection: CollectionSchema<V>) => void) {
        this.$items.forEach((value, key, _) => callbackfn(value, key, this));
    }

    values() {
        return this.$items.values();
    }

    get size () {
        return this.$items.size;
    }

    protected setIndex(index: number, key: number) {
        this.$indexes.set(index, key);
    }

    protected getIndex(index: number) {
        return this.$indexes.get(index);
    }

    protected getByIndex(index: number) {
        return this.$items.get(this.$indexes.get(index));
    }

    protected deleteByIndex(index: number) {
        const key = this.$indexes.get(index);
        this.$items.delete(key);
        this.$indexes.delete(index);
    }

    toArray() {
        return Array.from(this.$items.values());
    }

    toJSON() {
        const values: V[] = [];

        this.forEach((value, key) => {
            values.push(
                (typeof (value['toJSON']) === "function")
                    ? value['toJSON']()
                    : value
            );
        });

        return values;
    }

    //
    // Decoding utilities
    //
    clone(isDecoding?: boolean): CollectionSchema<V> {
        let cloned: CollectionSchema;

        if (isDecoding) {
            // client-side
            cloned = Object.assign(new CollectionSchema(), this);

        } else {
            // server-side
            cloned = new CollectionSchema();
            this.forEach((value) => {
                if (value['$changes']) {
                    cloned.add(value['clone']());
                } else {
                    cloned.add(value);
                }
            })
        }

        return cloned;
    }

}
