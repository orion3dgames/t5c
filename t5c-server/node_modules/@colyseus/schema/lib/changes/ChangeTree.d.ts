import { OPERATION } from "../spec";
import { Schema } from "../Schema";
import { FilterChildrenCallback } from "../annotations";
import { MapSchema } from "../types/MapSchema";
import { ArraySchema } from "../types/ArraySchema";
import { CollectionSchema } from "../types/CollectionSchema";
import { SetSchema } from "../types/SetSchema";
import { ReferenceTracker } from "./ReferenceTracker";
export type Ref = Schema | ArraySchema | MapSchema | CollectionSchema | SetSchema;
export interface ChangeOperation {
    op: OPERATION;
    index: number;
}
export interface FieldCache {
    beginIndex: number;
    endIndex: number;
}
export declare class ChangeTree {
    ref: Ref;
    refId: number;
    root?: ReferenceTracker;
    parent?: Ref;
    parentIndex?: number;
    indexes: {
        [index: string]: any;
    };
    changed: boolean;
    changes: Map<number, ChangeOperation>;
    allChanges: Set<number>;
    caches: {
        [field: number]: number[];
    };
    currentCustomOperation: number;
    constructor(ref: Ref, parent?: Ref, root?: ReferenceTracker);
    setParent(parent: Ref, root?: ReferenceTracker, parentIndex?: number): void;
    operation(op: ChangeOperation): void;
    change(fieldName: string | number, operation?: OPERATION): void;
    touch(fieldName: string | number): void;
    touchParents(): void;
    getType(index?: number): any;
    getChildrenFilter(): FilterChildrenCallback;
    getValue(index: number): any;
    delete(fieldName: string | number): void;
    discard(changed?: boolean, discardAll?: boolean): void;
    /**
     * Recursively discard all changes from this, and child structures.
     */
    discardAll(): void;
    cache(field: number, cachedBytes: number[]): void;
    clone(): ChangeTree;
    ensureRefId(): void;
    protected assertValidIndex(index: number, fieldName: string | number): void;
}
