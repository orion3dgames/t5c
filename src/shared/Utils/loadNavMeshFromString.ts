import { NavMesh, NavMeshLoader } from "yuka";
import { apiUrl } from "./index";

export default async function loadNavMeshFromString(fileNameNavMesh: string):NavMesh {
    let url = '/models/navmesh/'+fileNameNavMesh+'.glb' ;
    const loader = new NavMeshLoader(); 
    console.log(url);
    return loader.load(url, { mergeConvexRegions: false }).then((navMesh) => {
        return navMesh;
    });
}