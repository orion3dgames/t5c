import { NavMesh, NavMeshLoader } from "../Libs/yuka-min";

export default async function loadNavMeshFromString(fileNameNavMesh: string): Promise<NavMesh> {
    let url = "/models/navmesh/" + fileNameNavMesh + ".glb";
    const loader = new NavMeshLoader();
    return loader.load(url, { mergeConvexRegions: false }).then((navMesh) => {
        return navMesh;
    });
}
