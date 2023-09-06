import { ChangeTree } from "../changes/ChangeTree";
import { OPERATION } from "../spec";
import { SchemaDecoderCallbacks, Schema } from "../Schema";
import { addCallback, removeChildRefs } from "./utils";
import { DataChange } from "..";

const DEFAULT_SORT = (a: any, b: any) => {
    const A = a.toString();
    const B = b.toString();
    if (A < B) return -1;
    else if (A > B) return 1;
    else return 0
}

export function getArrayProxy(value: ArraySchema) {
    value['$proxy'] = true;

    //
    // compatibility with @colyseus/schema 0.5.x
    // - allow `map["key"]`
    // - allow `map["key"] = "xxx"`
    // - allow `delete map["key"]`
    //
    value = new Proxy(value, {
        get: (obj, prop) => {
            if (
                typeof (prop) !== "symbol" &&
                !isNaN(prop as any) // https://stackoverflow.com/a/175787/892698
            ) {
                return obj.at(prop as unknown as number);

            } else {
                return obj[prop];
            }
        },

        set: (obj, prop, setValue) => {
            if (
                typeof (prop) !== "symbol" &&
                !isNaN(prop as any)
            ) {
                const indexes = Array.from(obj['$items'].keys());
                const key = parseInt(indexes[prop] || prop);
                if (setValue === undefined || setValue === null) {
                    obj.deleteAt(key);

                } else {
                    obj.setAt(key, setValue);
                }

            } else {
                obj[prop] = setValue;
            }

            return true;
        },

        deleteProperty: (obj, prop) => {
            if (typeof (prop) === "number") {
                obj.deleteAt(prop);

            } else {
                delete obj[prop];
            }

            return true;
        },
    });

    return value;
}

export class ArraySchema<V = any> implements Array<V>, SchemaDecoderCallbacks {
    protected $changes: ChangeTree = new ChangeTree(this);

    protected $items: Map<number, V> = new Map<number, V>();
    protected $indexes: Map<number, number> = new Map<number, number>();

    protected $refId: number = 0;

    [n: number]: V;

    //
    // Decoding callbacks
    //
    public $callbacks: { [operation: number]: Array<(item: V, key: number) => void> };
    public onAdd(callback: (item: V, key: number) => void, triggerAll: boolean = true) {
        return addCallback(
            (this.$callbacks || (this.$callbacks = [])),
            OPERATION.ADD,
            callback,
            (triggerAll)
                ? this.$items
                : undefined
        );
    }
    public onRemove(callback: (item: V, key: number) => void) { return addCallback(this.$callbacks || (this.$callbacks = []), OPERATION.DELETE, callback); }
    public onChange(callback: (item: V, key: number) => void) { return addCallback(this.$callbacks || (this.$callbacks = []), OPERATION.REPLACE, callback); }

    static is(type: any) {
        return (
            // type format: ["string"]
            Array.isArray(type) ||

            // type format: { array: "string" }
            (type['array'] !== undefined)
        );
    }

    constructor (...items: V[]) {
        this.push.apply(this, items);
    }

    set length (value: number) {
        if (value === 0) {
            this.clear();

        } else {
            this.splice(value, this.length - value);
        }
    }

    get length() {
        return this.$items.size;
    }

    push(...values: V[]) {
        let lastIndex: number;

        values.forEach(value => {
            // set "index" for reference.
            lastIndex = this.$refId++;

            this.setAt(lastIndex, value);
        });

        return lastIndex;
    }

    /**
     * Removes the last element from an array and returns it.
     */
    pop(): V | undefined {
        const key = Array.from(this.$indexes.values()).pop();
        if (key === undefined) { return undefined; }

        this.$changes.delete(key);
        this.$indexes.delete(key);

        const value = this.$items.get(key);
        this.$items.delete(key);

        return value;
    }

    at(index: number) {
        //
        // FIXME: this should be O(1)
        //
        const key = Array.from(this.$items.keys())[index];
        return this.$items.get(key);
    }

    setAt(index: number, value: V) {
        if (value === undefined || value === null) {
            console.error("ArraySchema items cannot be null nor undefined; Use `deleteAt(index)` instead.");
            return;
        }

        // skip if the value is the same as cached.
        if (this.$items.get(index) === value) {
            return;
        }

        if (value['$changes'] !== undefined) {
            (value['$changes'] as ChangeTree).setParent(this, this.$changes.root, index);
        }

        const operation = this.$changes.indexes[index]?.op ?? OPERATION.ADD;

        this.$changes.indexes[index] = index;

        this.$indexes.set(index, index);
        this.$items.set(index, value);

        this.$changes.change(index, operation);
    }

    deleteAt(index: number) {
        const key = Array.from(this.$items.keys())[index];
        if (key === undefined) { return false; }
        return this.$deleteAt(key);
    }

    protected $deleteAt(index) {
        // delete at internal index
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

    /**
     * Combines two or more arrays.
     * @param items Additional items to add to the end of array1.
     */
    // @ts-ignore
    concat(...items: (V | ConcatArray<V>)[]): ArraySchema<V> {
        return new ArraySchema(...Array.from(this.$items.values()).concat(...items));
    }

    /**
     * Adds all the elements of an array separated by the specified separator string.
     * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
     */
    join(separator?: string): string {
        return Array.from(this.$items.values()).join(separator);
    }

    /**
     * Reverses the elements in an Array.
     */
    // @ts-ignore
    reverse(): ArraySchema<V> {
        const indexes = Array.from(this.$items.keys());
        const reversedItems = Array.from(this.$items.values()).reverse();

        reversedItems.forEach((item, i) => {
            this.setAt(indexes[i], item);
        });

        return this;
    }

    /**
     * Removes the first element from an array and returns it.
     */
    shift(): V | undefined {
        const indexes = Array.from(this.$items.keys());

        const shiftAt = indexes.shift();
        if (shiftAt === undefined) { return undefined; }

        const value = this.$items.get(shiftAt);
        this.$deleteAt(shiftAt);

        return value;
    }

    /**
     * Returns a section of an array.
     * @param start The beginning of the specified portion of the array.
     * @param end The end of the specified portion of the array. This is exclusive of the element at the index 'end'.
     */
    slice(start?: number, end?: number): V[] {
        const sliced = new ArraySchema<V>();
        sliced.push(...Array.from(this.$items.values()).slice(start, end));
        return sliced as unknown as V[];
    }

    /**
     * Sorts an array.
     * @param compareFn Function used to determine the order of the elements. It is expected to return
     * a negative value if first argument is less than second argument, zero if they're equal and a positive
     * value otherwise. If omitted, the elements are sorted in ascending, ASCII character order.
     * ```ts
     * [11,2,22,1].sort((a, b) => a - b)
     * ```
     */
    sort(compareFn: (a: V, b: V) => number = DEFAULT_SORT): this {
        const indexes = Array.from(this.$items.keys());
        const sortedItems = Array.from(this.$items.values()).sort(compareFn);

        sortedItems.forEach((item, i) => {
            this.setAt(indexes[i], item);
        });

        return this;
    }

    /**
     * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
     * @param start The zero-based location in the array from which to start removing elements.
     * @param deleteCount The number of elements to remove.
     * @param items Elements to insert into the array in place of the deleted elements.
     */
    splice(
        start: number,
        deleteCount: number = this.length - start,
        ...items: V[]
    ): V[] {
        const indexes = Array.from(this.$items.keys());
        const removedItems: V[] = [];

        for (let i = start; i < start + deleteCount; i++) {
            removedItems.push(this.$items.get(indexes[i]));
            this.$deleteAt(indexes[i]);
        }

        return removedItems;
    }

    /**
     * Inserts new elements at the start of an array.
     * @param items  Elements to insert at the start of the Array.
     */
    unshift(...items: V[]): number {
        const length = this.length;
        const addedLength = items.length;

        // const indexes = Array.from(this.$items.keys());
        const previousValues = Array.from(this.$items.values());

        items.forEach((item, i) => {
            this.setAt(i, item);
        });

        previousValues.forEach((previousValue, i) => {
            this.setAt(addedLength + i, previousValue);
        });

        return length + addedLength;
    }

    /**
     * Returns the index of the first occurrence of a value in an array.
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
     */
    indexOf(searchElement: V, fromIndex?: number): number {
        return Array.from(this.$items.values()).indexOf(searchElement, fromIndex);
    }

    /**
     * Returns the index of the last occurrence of a specified value in an array.
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.
     */
    lastIndexOf(searchElement: V, fromIndex: number = this.length - 1): number {
        return Array.from(this.$items.values()).lastIndexOf(searchElement, fromIndex);
    }

    /**
     * Determines whether all the members of an array satisfy the specified test.
     * @param callbackfn A function that accepts up to three arguments. The every method calls
     * the callbackfn function for each element in the array until the callbackfn returns a value
     * which is coercible to the Boolean value false, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     */
    every(callbackfn: (value: V, index: number, array: V[]) => unknown, thisArg?: any): boolean {
        return Array.from(this.$items.values()).every(callbackfn, thisArg);
    }

    /**
     * Determines whether the specified callback function returns true for any element of an array.
     * @param callbackfn A function that accepts up to three arguments. The some method calls
     * the callbackfn function for each element in the array until the callbackfn returns a value
     * which is coercible to the Boolean value true, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     */
    some(callbackfn: (value: V, index: number, array: V[]) => unknown, thisArg?: any): boolean {
        return Array.from(this.$items.values()).some(callbackfn, thisArg);
    }

    /**
     * Performs the specified action for each element in an array.
     * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
     * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    forEach(callbackfn: (value: V, index: number, array: V[]) => void, thisArg?: any): void {
        Array.from(this.$items.values()).forEach(callbackfn, thisArg);
    }

    /**
     * Calls a defined callback function on each element of an array, and returns an array that contains the results.
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    map<U>(callbackfn: (value: V, index: number, array: V[]) => U, thisArg?: any): U[] {
        return Array.from(this.$items.values()).map(callbackfn, thisArg);
    }

    /**
     * Returns the elements of an array that meet the condition specified in a callback function.
     * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    filter(callbackfn: (value: V, index: number, array: V[]) => unknown, thisArg?: any)
    filter<S extends V>(callbackfn: (value: V, index: number, array: V[]) => value is S, thisArg?: any): V[] {
        return Array.from(this.$items.values()).filter(callbackfn, thisArg);
    }

    /**
     * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduce<U=V>(callbackfn: (previousValue: U, currentValue: V, currentIndex: number, array: V[]) => U, initialValue?: U): U {
        return Array.prototype.reduce.apply(Array.from(this.$items.values()), arguments);
    }

    /**
     * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduceRight<U=V>(callbackfn: (previousValue: U, currentValue: V, currentIndex: number, array: V[]) => U, initialValue?: U): U {
        return Array.prototype.reduceRight.apply(Array.from(this.$items.values()), arguments);
    }

    /**
     * Returns the value of the first element in the array where predicate is true, and undefined
     * otherwise.
     * @param predicate find calls predicate once for each element of the array, in ascending
     * order, until it finds one where predicate returns true. If such an element is found, find
     * immediately returns that element value. Otherwise, find returns undefined.
     * @param thisArg If provided, it will be used as the this value for each invocation of
     * predicate. If it is not provided, undefined is used instead.
     */
    find(predicate: (value: V, index: number, obj: V[]) => boolean, thisArg?: any): V | undefined {
        return Array.from(this.$items.values()).find(predicate, thisArg);
    }

    /**
     * Returns the index of the first element in the array where predicate is true, and -1
     * otherwise.
     * @param predicate find calls predicate once for each element of the array, in ascending
     * order, until it finds one where predicate returns true. If such an element is found,
     * findIndex immediately returns that element index. Otherwise, findIndex returns -1.
     * @param thisArg If provided, it will be used as the this value for each invocation of
     * predicate. If it is not provided, undefined is used instead.
     */
    findIndex(predicate: (value: V, index: number, obj: V[]) => unknown, thisArg?: any): number {
        return Array.from(this.$items.values()).findIndex(predicate, thisArg);
    }

    /**
     * Returns the this object after filling the section identified by start and end with value
     * @param value value to fill array section with
     * @param start index to start filling the array at. If start is negative, it is treated as
     * length+start where length is the length of the array.
     * @param end index to stop filling the array at. If end is negative, it is treated as
     * length+end.
     */
    fill(value: V, start?: number, end?: number): this {
        //
        // TODO
        //
        throw new Error("ArraySchema#fill() not implemented");
        // this.$items.fill(value, start, end);

        return this;
    }

    /**
     * Returns the this object after copying a section of the array identified by start and end
     * to the same array starting at position target
     * @param target If target is negative, it is treated as length+target where length is the
     * length of the array.
     * @param start If start is negative, it is treated as length+start. If end is negative, it
     * is treated as length+end.
     * @param end If not specified, length of the this object is used as its default value.
     */
    copyWithin(target: number, start: number, end?: number): this {
        //
        // TODO
        //
        throw new Error("ArraySchema#copyWithin() not implemented");
        return this;
    }

    /**
     * Returns a string representation of an array.
     */
    toString(): string { return this.$items.toString(); }

    /**
     * Returns a string representation of an array. The elements are converted to string using their toLocalString methods.
     */
    toLocaleString(): string { return this.$items.toLocaleString() };

    /** Iterator */
    [Symbol.iterator](): IterableIterator<V> {
        return Array.from(this.$items.values())[Symbol.iterator]();
    }

    static get [Symbol.species]() {
        return ArraySchema;
    }

    // WORKAROUND for compatibility
    // - TypeScript 4 defines @@unscopables as a function
    // - TypeScript 5 defines @@unscopables as an object
    [Symbol.unscopables]: any;

    /**
     * Returns an iterable of key, value pairs for every entry in the array
     */
    entries(): IterableIterator<[number, V]> { return this.$items.entries(); }

    /**
     * Returns an iterable of keys in the array
     */
    keys(): IterableIterator<number> { return this.$items.keys(); }

    /**
     * Returns an iterable of values in the array
     */
    values(): IterableIterator<V> { return this.$items.values(); }

    /**
     * Determines whether an array includes a certain element, returning true or false as appropriate.
     * @param searchElement The element to search for.
     * @param fromIndex The position in this array at which to begin searching for searchElement.
     */
    includes(searchElement: V, fromIndex?: number): boolean {
        return Array.from(this.$items.values()).includes(searchElement, fromIndex);
    }

    /**
     * Calls a defined callback function on each element of an array. Then, flattens the result into
     * a new array.
     * This is identical to a map followed by flat with depth 1.
     *
     * @param callback A function that accepts up to three arguments. The flatMap method calls the
     * callback function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callback function. If
     * thisArg is omitted, undefined is used as the this value.
     */
    // @ts-ignore
    flatMap<U, This = undefined>(callback: (this: This, value: V, index: number, array: V[]) => U | ReadonlyArray<U>, thisArg?: This): U[] {
        // @ts-ignore
        throw new Error("ArraySchema#flatMap() is not supported.");
    }

    /**
     * Returns a new array with all sub-array elements concatenated into it recursively up to the
     * specified depth.
     *
     * @param depth The maximum recursion depth
     */
    // @ts-ignore
    flat<A, D extends number = 1>(this: A, depth?: D): any {
        throw new Error("ArraySchema#flat() is not supported.");
    }

    findLast() {
        const arr = Array.from(this.$items.values());
        // @ts-ignore
        return arr.findLast.apply(arr, arguments);
    }

    findLastIndex(...args) {
        const arr = Array.from(this.$items.values());
        // @ts-ignore
        return arr.findLastIndex.apply(arr, arguments);
    }

    // get size () {
    //     return this.$items.size;
    // }

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
        return this.toArray().map((value) => {
            return (typeof (value['toJSON']) === "function")
                ? value['toJSON']()
                : value;
        });
    }

    //
    // Decoding utilities
    //
    clone(isDecoding?: boolean): ArraySchema<V> {
        let cloned: ArraySchema;

        if (isDecoding) {
            cloned = new ArraySchema(...Array.from(this.$items.values()));

        } else {
            cloned = new ArraySchema(...this.map(item => (
                (item['$changes'])
                    ? (item as any as Schema).clone()
                    : item
            )));
        }

        return cloned;
    };

}
