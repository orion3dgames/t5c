import { NavMesh, NavMeshLoader } from "yuka";
import { apiUrl } from "./index";

export default async function loadNavMeshFromString(fileNameNavMesh: string):NavMesh {
    let url = '/public/models/navmesh/'+fileNameNavMesh+'.glb' ;
    const loader = new NavMeshLoader(); 
    return loader.load(apiUrl()+url).then((navMesh) => {
        return navMesh;
    });
    /*
    var jsonNavMesh = wavefrontObjParser(fileNameNavMesh)
    const meshPolygonPoints:PolyPoints[] = [];
    const vertexPositions = jsonNavMesh.vertexPositions
    const array = jsonNavMesh.vertexPositionIndices
    for (let index = 0; index < array.length; index += 4) {
        const aIndex = array[index];
        const bIndex = array[index + 1]
        const cIndex = array[index + 2]
        meshPolygonPoints.push([
            {
                x: vertexPositions[aIndex * 3],
                y: vertexPositions[(aIndex * 3) + 2]
            },
            {
                x: vertexPositions[bIndex * 3],
                y: vertexPositions[(bIndex * 3) + 2]
            },
            {
                x: vertexPositions[cIndex * 3],
                y: vertexPositions[(cIndex * 3) + 2]
            }            
        ])
    }
    const navMesh = new NavMesh(meshPolygonPoints);
    return navMesh
    */
}