///////////////////////////////////////////////////////////
// CAPTAIN OBVIOUS HERE: 
// this can only be used in a NODE ENVIRONMENT, do not use to import in the client as fs is not available.

import fs from 'fs';
import path from 'path';
import * as YUKA from '../yuka';

export default async function loadNavMeshFromFile(fileNameNavMesh: string):YUKA.NavMesh {
    const data = await fs.readFileSync( path.join( __dirname, '../../../public/models/navmesh/'+fileNameNavMesh+'.glb' ) );
    const loader = new YUKA.NavMeshLoader(); 
    return loader.parse( data.buffer, "",{ mergeConvexRegions: false }).then(navmesh=>{
        return navmesh;
    })
}