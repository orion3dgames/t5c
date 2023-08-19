import { Mesh } from "@babylonjs/core/Meshes/mesh";

const mergeMesh = function (mesh) {
    const allChildMeshes = mesh.getChildTransformNodes(true)[0].getChildMeshes(false);
    const merged = Mesh.MergeMeshes(allChildMeshes, false, true, undefined, undefined, true);
    if (merged) {
        merged.name = "_merged";
    }
    return merged;
};

export { mergeMesh };
