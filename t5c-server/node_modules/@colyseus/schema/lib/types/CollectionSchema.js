"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionSchema = void 0;
const ChangeTree_1 = require("../changes/ChangeTree");
const spec_1 = require("../spec");
const utils_1 = require("./utils");
class CollectionSchema {
    onAdd(callback, triggerAll = true) {
        return (0, utils_1.addCallback)((this.$callbacks || (this.$callbacks = [])), spec_1.OPERATION.ADD, callback, (triggerAll)
            ? this.$items
            : undefined);
    }
    onRemove(callback) { return (0, utils_1.addCallback)(this.$callbacks || (this.$callbacks = []), spec_1.OPERATION.DELETE, callback); }
    onChange(callback) { return (0, utils_1.addCallback)(this.$callbacks || (this.$callbacks = []), spec_1.OPERATION.REPLACE, callback); }
    static is(type) {
        return type['collection'] !== undefined;
    }
    constructor(initialValues) {
        this.$changes = new ChangeTree_1.ChangeTree(this);
        this.$items = new Map();
        this.$indexes = new Map();
        this.$refId = 0;
        if (initialValues) {
            initialValues.forEach((v) => this.add(v));
        }
    }
    add(value) {
        // set "index" for reference.
        const index = this.$refId++;
        const isRef = (value['$changes']) !== undefined;
        if (isRef) {
            value['$changes'].setParent(this, this.$changes.root, index);
        }
        this.$changes.indexes[index] = index;
        this.$indexes.set(index, index);
        this.$items.set(index, value);
        this.$changes.change(index);
        return index;
    }
    at(index) {
        const key = Array.from(this.$items.keys())[index];
        return this.$items.get(key);
    }
    entries() {
        return this.$items.entries();
    }
    delete(item) {
        const entries = this.$items.entries();
        let index;
        let entry;
        while (entry = entries.next()) {
            if (entry.done) {
                break;
            }
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
    clear(changes) {
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
            utils_1.removeChildRefs.call(this, changes);
        }
        // clear items
        this.$items.clear();
        this.$changes.operation({ index: 0, op: spec_1.OPERATION.CLEAR });
        // touch all structures until reach root
        this.$changes.touchParents();
    }
    has(value) {
        return Array.from(this.$items.values()).some((v) => v === value);
    }
    forEach(callbackfn) {
        this.$items.forEach((value, key, _) => callbackfn(value, key, this));
    }
    values() {
        return this.$items.values();
    }
    get size() {
        return this.$items.size;
    }
    setIndex(index, key) {
        this.$indexes.set(index, key);
    }
    getIndex(index) {
        return this.$indexes.get(index);
    }
    getByIndex(index) {
        return this.$items.get(this.$indexes.get(index));
    }
    deleteByIndex(index) {
        const key = this.$indexes.get(index);
        this.$items.delete(key);
        this.$indexes.delete(index);
    }
    toArray() {
        return Array.from(this.$items.values());
    }
    toJSON() {
        const values = [];
        this.forEach((value, key) => {
            values.push((typeof (value['toJSON']) === "function")
                ? value['toJSON']()
                : value);
        });
        return values;
    }
    //
    // Decoding utilities
    //
    clone(isDecoding) {
        let cloned;
        if (isDecoding) {
            // client-side
            cloned = Object.assign(new CollectionSchema(), this);
        }
        else {
            // server-side
            cloned = new CollectionSchema();
            this.forEach((value) => {
                if (value['$changes']) {
                    cloned.add(value['clone']());
                }
                else {
                    cloned.add(value);
                }
            });
        }
        return cloned;
    }
}
exports.CollectionSchema = CollectionSchema;
//# sourceMappingURL=CollectionSchema.js.map