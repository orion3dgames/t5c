import { Mesh } from "@babylonjs/core/Meshes/mesh";

const mergeMesh = function (mesh, key = "MERGED_") {
    const allChildMeshes = mesh.getChildMeshes(false);
    const merged = Mesh.MergeMeshes(allChildMeshes, false, false, undefined, false, false);
    if (merged) {
        merged.name = key + "_" + mesh.name;
        return merged;
    }
};

const mergeMeshAndSkeleton = function (mesh, skeleton, name = "_MergedModel") {
    // pick what you want to merge
    const allChildMeshes = mesh.getChildTransformNodes(true)[0].getChildMeshes(false);

    // Ignore Backpack because pf different attributes
    // https://forum.babylonjs.com/t/error-during-merging-meshes-from-imported-glb/23483
    // https://forum.babylonjs.com/t/mesh-merging-error/43624
    //const childMeshes = allChildMeshes.filter((m) => !m.name.includes("Backpack"));

    /*
    allChildMeshes.forEach(element => {
        console.log(element.id, element.getVerticesDataKinds());
         mesh.removeVerticesData(BABYLON.VertexBuffer.ColorKind)
    });*/

    // multiMaterial = true
    const merged = Mesh.MergeMeshes(allChildMeshes, false, true, undefined, undefined, false);
    if (merged) {
        merged.name = name;
        merged.skeleton = skeleton;
    }
    return merged;
};

export { mergeMesh, mergeMeshAndSkeleton };
