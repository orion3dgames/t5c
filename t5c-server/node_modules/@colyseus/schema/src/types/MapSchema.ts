import { SchemaDecoderCallbacks } from "../Schema";
import { addCallback, removeChildRefs } from "./utils";
import { DataChange } from "..";
import { ChangeTree } from "../changes/ChangeTree";
import { OPERATION } from "../spec";

export function getMapProxy(value: MapSchema) {
    value['$proxy'] = true;

    value = new Proxy(value, {
        get: (obj, prop) => {
            if (
                typeof (prop) !== "symbol" && // accessing properties
                typeof (obj[prop]) === "undefined"
            ) {
                return obj.get(prop as string);

            } else {
                return obj[prop];
            }
        },

        set: (obj, prop, setValue) => {
            if (
                typeof (prop) !== "symbol" &&
                (
                    (prop as string).indexOf("$") === -1 &&
                    prop !== "onAdd" &&
                    prop !== "onRemove" &&
                    prop !== "onChange"
                )
            ) {
                obj.set(prop as string, setValue);

            } else {
                obj[prop] = setValue;
            }
            return true;
        },

        deleteProperty: (obj, prop) => {
            obj.delete(prop as string);
            return true;
        },
    });

    return value;
}

export class MapSchema<V=any, K extends string = string> implements Map<K, V>, SchemaDecoderCallbacks {
    protected $changes: ChangeTree = new ChangeTree(this);

    protected $items: Map<K, V> = new Map<K, V>();
    protected $indexes: Map<number, K> = new Map<number, K>();

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
        return type['map'] !== undefined;
    }

    constructor (initialValues?: Map<K, V> | Record<K, V>) {
        if (initialValues) {
            if (
                initialValues instanceof Map ||
                initialValues instanceof MapSchema
            ) {
                initialValues.forEach((v, k) => this.set(k, v));

            } else {
                for (const k in initialValues) {
                    this.set(k, initialValues[k]);
                }
            }
        }
    }

    /** Iterator */
    [Symbol.iterator](): IterableIterator<[K, V]> { return this.$items[Symbol.iterator](); }
    get [Symbol.toStringTag]() { return this.$items[Symbol.toStringTag] }

    static get [Symbol.species]() {
        return MapSchema;
    }

    set(key: K, value: V) {
        if (value === undefined || value === null) {
            throw new Error(`MapSchema#set('${key}', ${value}): trying to set ${value} value on '${key}'.`);
        }

        // Force "key" as string
        // See: https://github.com/colyseus/colyseus/issues/561#issuecomment-1646733468
        key = key.toString() as K;

        // get "index" for this value.
        const hasIndex = typeof(this.$changes.indexes[key]) !== "undefined";
        const index = (hasIndex)
            ? this.$changes.indexes[key]
            : this.$refId++;

        let operation: OPERATION = (hasIndex)
            ? OPERATION.REPLACE
            : OPERATION.ADD;

        const isRef = (value['$changes']) !== undefined;
        if (isRef) {
            (value['$changes'] as ChangeTree).setParent(
                this,
                this.$changes.root,
                index
            );
        }

        //
        // (encoding)
        // set a unique id to relate directly with this key/value.
        //
        if (!hasIndex) {
            this.$changes.indexes[key] = index;
            this.$indexes.set(index, key);

        } else if (
            !isRef &&
            this.$items.get(key) === value
        ) {
            // if value is the same, avoid re-encoding it.
            return;

        } else if (
            isRef && // if is schema, force ADD operation if value differ from previous one.
            this.$items.get(key) !== value
        ) {
            operation = OPERATION.ADD;
        }

        this.$items.set(key, value);

        this.$changes.change(key, operation);

        return this;
    }

    get(key: K): V | undefined {
        return this.$items.get(key);
    }

    delete(key: K) {
        //
        // TODO: add a "purge" method after .encode() runs, to cleanup removed `$indexes`
        //
        // We don't remove $indexes to allow setting the same key in the same patch
        // (See "should allow to remove and set an item in the same place" test)
        //
        // // const index = this.$changes.indexes[key];
        // // this.$indexes.delete(index);

        this.$changes.delete(key);
        return this.$items.delete(key);
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

    has (key: K) {
        return this.$items.has(key);
    }

    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void) {
        this.$items.forEach(callbackfn);
    }

    entries () {
        return this.$items.entries();
    }

    keys () {
        return this.$items.keys();
    }

    values() {
        return this.$items.values();
    }

    get size () {
        return this.$items.size;
    }

    protected setIndex(index: number, key: K) {
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

    toJSON() {
        const map: any = {};

        this.forEach((value, key) => {
            map[key] = (typeof (value['toJSON']) === "function")
                ? value['toJSON']()
                : value;
        });

        return map;
    }

    //
    // Decoding utilities
    //
    clone(isDecoding?: boolean): MapSchema<V> {
        let cloned: MapSchema;

        if (isDecoding) {
            // client-side
            cloned = Object.assign(new MapSchema(), this);

        } else {
            // server-side
            cloned = new MapSchema();
            this.forEach((value, key) => {
                if (value['$changes']) {
                    cloned.set(key, value['clone']());
                } else {
                    cloned.set(key, value);
                }
            })
        }

        return cloned;
    }

}
