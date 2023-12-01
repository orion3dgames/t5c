import { Mesh } from "@babylonjs/core/Meshes/mesh";

const mergeMesh = function (mesh, key = "MERGED_") {
    const allChildMeshes = mesh.getChildMeshes(false);
    const merged = Mesh.MergeMeshes(allChildMeshes, false, false, undefined, false, false);
    if (merged) {
        merged.name = key + "_" + mesh.name;
        return merged;
    }
};

const mergeMeshAndSkeleton = function (mesh, skeleton) {
    // pick what you want to merge
    const allChildMeshes = mesh.getChildTransformNodes(true)[0].getChildMeshes(false);

    // Ignore Backpack because pf different attributes
    // https://forum.babylonjs.com/t/error-during-merging-meshes-from-imported-glb/23483
    //const childMeshes = allChildMeshes.filter((m) => !m.name.includes("Backpack"));

    // multiMaterial = true
    const merged = Mesh.MergeMeshes(allChildMeshes, false, true, undefined, undefined, true);
    if (merged) {
        merged.name = "_MergedModel";
        merged.skeleton = skeleton;
    }
    return merged;
};

export { mergeMesh, mergeMeshAndSkeleton };
