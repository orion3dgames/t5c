import fs from 'fs-extra'
import wavefrontObjParser from 'wavefront-obj-parser'
import NavMesh from 'navmesh';

export async function loadNavMesh(fileNameNavMesh: string) {
    const fileNavMesh = await fs.readFile(`./public/models/${fileNameNavMesh}/navmesh.obj`, 'utf8')
    var jsonNavMesh = wavefrontObjParser(fileNavMesh)
    const meshPolygonPoints = []
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