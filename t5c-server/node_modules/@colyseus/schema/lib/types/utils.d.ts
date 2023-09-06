import { CollectionSchema, DataChange } from "..";
import { OPERATION } from "../spec";
export declare function addCallback($callbacks: {
    [op: number]: Function[];
}, op: OPERATION, callback: (item: any, key: any) => void, existing?: {
    forEach(callback: (item: any, key: any) => void): void;
}): () => boolean;
export declare function removeChildRefs(this: CollectionSchema, changes: DataChange[]): void;
export declare function spliceOne(arr: any[], index: number): boolean;
