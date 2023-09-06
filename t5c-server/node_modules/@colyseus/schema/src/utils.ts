import { Schema } from "./";
import { ChangeTree } from "./changes/ChangeTree";

export function dumpChanges(schema: Schema) {
    const changeTrees: ChangeTree[] = [schema['$changes']];
    let numChangeTrees = 1;

    const dump = {};
    let currentStructure = dump;

    for (let i = 0; i < numChangeTrees; i++) {
        const changeTree = changeTrees[i];

        changeTree.changes.forEach((change) => {
            const ref = changeTree.ref;
            const fieldIndex = change.index;

            const field = ((ref as Schema)['_definition'])
                ? ref['_definition'].fieldsByIndex[fieldIndex]
                : ref['$indexes'].get(fieldIndex);

            currentStructure[field] = changeTree.getValue(fieldIndex);
        });

    }

    return dump;
}