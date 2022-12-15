import { NavMesh, NavMeshLoader } from "../yuka";

export default async function loadNavMeshFromString(fileNameNavMesh: string):NavMesh {
    let url = '/models/navmesh/'+fileNameNavMesh+'.glb' ;
    const loader = new NavMeshLoader(); 
    return loader.load(url, { mergeConvexRegions: false }).then((navMesh) => {
        return navMesh;
    });
}