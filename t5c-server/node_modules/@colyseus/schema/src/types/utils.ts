import { CollectionSchema, DataChange } from "..";
import { OPERATION } from "../spec";

export function addCallback(
    $callbacks: { [op: number]: Function[] },
    op: OPERATION,
    callback: (item: any, key: any) => void,
    existing?: { forEach(callback: (item: any, key: any) => void): void; }
) {
    // initialize list of callbacks
    if (!$callbacks[op]) {
        $callbacks[op] = [];
    }

    $callbacks[op].push(callback);

    //
    // Trigger callback for existing elements
    // - OPERATION.ADD
    // - OPERATION.REPLACE
    //
    existing?.forEach((item, key) => callback(item, key));

    return () => spliceOne($callbacks[op], $callbacks[op].indexOf(callback));
}


export function removeChildRefs(this: CollectionSchema, changes: DataChange[]) {
    const needRemoveRef = (typeof (this.$changes.getType()) !== "string");

    this.$items.forEach((item: any, key: any) => {
        changes.push({
            refId: this.$changes.refId,
            op: OPERATION.DELETE,
            field: key,
            value: undefined,
            previousValue: item
        });

        if (needRemoveRef) {
            this.$changes.root.removeRef(item['$changes'].refId);
        }
    });
}


export function spliceOne(arr: any[], index: number): boolean {
    // manually splice an array
    if (index === -1 || index >= arr.length) {
        return false;
    }

    const len = arr.length - 1;

    for (let i = index; i < len; i++) {
        arr[i] = arr[i + 1];
    }

    arr.length = len;

    return true;
}