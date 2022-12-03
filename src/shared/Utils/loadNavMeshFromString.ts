///////////////////////////////////////////////////////////
// CAPTAIN OBVIOUS HERE: 
// this can only be used in a NODE ENVIRONMENT, do not use to import in the client as fs is not available.

import wavefrontObjParser from 'wavefront-obj-parser';
import NavMesh, { PolyPoints } from 'navmesh';

export default async function loadNavMeshFromString(fileNameNavMesh: string) {
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
}