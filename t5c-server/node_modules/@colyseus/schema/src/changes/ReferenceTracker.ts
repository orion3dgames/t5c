import { Schema } from "../Schema";
import { Ref } from "./ChangeTree";
import type { SchemaDefinition } from "../annotations";

export class ReferenceTracker {
    //
    // Relation of refId => Schema structure
    // For direct access of structures during decoding time.
    //
    public refs = new Map<number, Ref>();
    public refCounts: { [refId: number]: number; } = {};
    public deletedRefs = new Set<number>();

    protected nextUniqueId: number = 0;

    getNextUniqueId() {
        return this.nextUniqueId++;
    }

    // for decoding
    addRef(refId: number, ref: Ref, incrementCount: boolean = true) {
        this.refs.set(refId, ref);

        if (incrementCount) {
            this.refCounts[refId] = (this.refCounts[refId] || 0) + 1;
        }
    }

    // for decoding
    removeRef(refId) {
        this.refCounts[refId] = this.refCounts[refId] - 1;
        this.deletedRefs.add(refId);
    }

    clearRefs() {
        this.refs.clear();
        this.deletedRefs.clear();
        this.refCounts = {};
    }

    // for decoding
    garbageCollectDeletedRefs() {
        this.deletedRefs.forEach((refId) => {
            //
            // Skip active references.
            //
            if (this.refCounts[refId] > 0) { return; }

            const ref = this.refs.get(refId);

            //
            // Ensure child schema instances have their references removed as well.
            //
            if (ref instanceof Schema) {
                for (const fieldName in ref['_definition'].schema) {
                    if (typeof (ref['_definition'].schema[fieldName]) !== "string" &&
                        ref[fieldName] &&
                        ref[fieldName]['$changes']) {
                        this.removeRef(ref[fieldName]['$changes'].refId);
                    }
                }

            } else {
                const definition: SchemaDefinition = ref['$changes'].parent._definition;
                const type = definition.schema[definition.fieldsByIndex[ref['$changes'].parentIndex]];

                if (typeof (Object.values(type)[0]) === "function") {
                    Array.from(ref.values())
                        .forEach((child) => this.removeRef(child['$changes'].refId));
                }
            }

            this.refs.delete(refId);
            delete this.refCounts[refId];
        });

        // clear deleted refs.
        this.deletedRefs.clear();
    }

}
