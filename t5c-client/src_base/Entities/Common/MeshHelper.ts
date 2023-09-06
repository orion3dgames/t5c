import { Mesh } from "@babylonjs/core/Meshes/mesh";

const mergeMesh = function (mesh, key = "MERGED_") {
    const allChildMeshes = mesh.getChildMeshes(false);
    const merged = Mesh.MergeMeshes(allChildMeshes, false, true, undefined, undefined, true);
    if (merged) {
        merged.name = key + "_" + mesh.name;
    }
    return merged;
};

export { mergeMesh };
