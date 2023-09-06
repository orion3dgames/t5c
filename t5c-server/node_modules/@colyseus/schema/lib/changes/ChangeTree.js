"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeTree = void 0;
const spec_1 = require("../spec");
const Schema_1 = require("../Schema");
class ChangeTree {
    constructor(ref, parent, root) {
        this.changed = false;
        this.changes = new Map();
        this.allChanges = new Set();
        // cached indexes for filtering
        this.caches = {};
        this.currentCustomOperation = 0;
        this.ref = ref;
        this.setParent(parent, root);
    }
    setParent(parent, root, parentIndex) {
        if (!this.indexes) {
            this.indexes = (this.ref instanceof Schema_1.Schema)
                ? this.ref['_definition'].indexes
                : {};
        }
        this.parent = parent;
        this.parentIndex = parentIndex;
        // avoid setting parents with empty `root`
        if (!root) {
            return;
        }
        this.root = root;
        //
        // assign same parent on child structures
        //
        if (this.ref instanceof Schema_1.Schema) {
            const definition = this.ref['_definition'];
            for (let field in definition.schema) {
                const value = this.ref[field];
                if (value && value['$changes']) {
                    const parentIndex = definition.indexes[field];
                    value['$changes'].setParent(this.ref, root, parentIndex);
                }
            }
        }
        else if (typeof (this.ref) === "object") {
            this.ref.forEach((value, key) => {
                if (value instanceof Schema_1.Schema) {
                    const changeTreee = value['$changes'];
                    const parentIndex = this.ref['$changes'].indexes[key];
                    changeTreee.setParent(this.ref, this.root, parentIndex);
                }
            });
        }
    }
    operation(op) {
        this.changes.set(--this.currentCustomOperation, op);
    }
    change(fieldName, operation = spec_1.OPERATION.ADD) {
        const index = (typeof (fieldName) === "number")
            ? fieldName
            : this.indexes[fieldName];
        this.assertValidIndex(index, fieldName);
        const previousChange = this.changes.get(index);
        if (!previousChange ||
            previousChange.op === spec_1.OPERATION.DELETE ||
            previousChange.op === spec_1.OPERATION.TOUCH // (mazmorra.io's BattleAction issue)
        ) {
            this.changes.set(index, {
                op: (!previousChange)
                    ? operation
                    : (previousChange.op === spec_1.OPERATION.DELETE)
                        ? spec_1.OPERATION.DELETE_AND_ADD
                        : operation,
                // : OPERATION.REPLACE,
                index
            });
        }
        this.allChanges.add(index);
        this.changed = true;
        this.touchParents();
    }
    touch(fieldName) {
        const index = (typeof (fieldName) === "number")
            ? fieldName
            : this.indexes[fieldName];
        this.assertValidIndex(index, fieldName);
        if (!this.changes.has(index)) {
            this.changes.set(index, { op: spec_1.OPERATION.TOUCH, index });
        }
        this.allChanges.add(index);
        // ensure touch is placed until the $root is found.
        this.touchParents();
    }
    touchParents() {
        if (this.parent) {
            this.parent['$changes'].touch(this.parentIndex);
        }
    }
    getType(index) {
        if (this.ref['_definition']) {
            const definition = this.ref['_definition'];
            return definition.schema[definition.fieldsByIndex[index]];
        }
        else {
            const definition = this.parent['_definition'];
            const parentType = definition.schema[definition.fieldsByIndex[this.parentIndex]];
            //
            // Get the child type from parent structure.
            // - ["string"] => "string"
            // - { map: "string" } => "string"
            // - { set: "string" } => "string"
            //
            return Object.values(parentType)[0];
        }
    }
    getChildrenFilter() {
        const childFilters = this.parent['_definition'].childFilters;
        return childFilters && childFilters[this.parentIndex];
    }
    //
    // used during `.encode()`
    //
    getValue(index) {
        return this.ref['getByIndex'](index);
    }
    delete(fieldName) {
        const index = (typeof (fieldName) === "number")
            ? fieldName
            : this.indexes[fieldName];
        if (index === undefined) {
            console.warn(`@colyseus/schema ${this.ref.constructor.name}: trying to delete non-existing index: ${fieldName} (${index})`);
            return;
        }
        const previousValue = this.getValue(index);
        // console.log("$changes.delete =>", { fieldName, index, previousValue });
        this.changes.set(index, { op: spec_1.OPERATION.DELETE, index });
        this.allChanges.delete(index);
        // delete cache
        delete this.caches[index];
        // remove `root` reference
        if (previousValue && previousValue['$changes']) {
            previousValue['$changes'].parent = undefined;
        }
        this.changed = true;
        this.touchParents();
    }
    discard(changed = false, discardAll = false) {
        //
        // Map, Array, etc:
        // Remove cached key to ensure ADD operations is unsed instead of
        // REPLACE in case same key is used on next patches.
        //
        // TODO: refactor this. this is not relevant for Collection and Set.
        //
        if (!(this.ref instanceof Schema_1.Schema)) {
            this.changes.forEach((change) => {
                if (change.op === spec_1.OPERATION.DELETE) {
                    const index = this.ref['getIndex'](change.index);
                    delete this.indexes[index];
                }
            });
        }
        this.changes.clear();
        this.changed = changed;
        if (discardAll) {
            this.allChanges.clear();
        }
        // re-set `currentCustomOperation`
        this.currentCustomOperation = 0;
    }
    /**
     * Recursively discard all changes from this, and child structures.
     */
    discardAll() {
        this.changes.forEach((change) => {
            const value = this.getValue(change.index);
            if (value && value['$changes']) {
                value['$changes'].discardAll();
            }
        });
        this.discard();
    }
    // cache(field: number, beginIndex: number, endIndex: number) {
    cache(field, cachedBytes) {
        this.caches[field] = cachedBytes;
    }
    clone() {
        return new ChangeTree(this.ref, this.parent, this.root);
    }
    ensureRefId() {
        // skip if refId is already set.
        if (this.refId !== undefined) {
            return;
        }
        this.refId = this.root.getNextUniqueId();
    }
    assertValidIndex(index, fieldName) {
        if (index === undefined) {
            throw new Error(`ChangeTree: missing index for field "${fieldName}"`);
        }
    }
}
exports.ChangeTree = ChangeTree;
//# sourceMappingURL=ChangeTree.js.map