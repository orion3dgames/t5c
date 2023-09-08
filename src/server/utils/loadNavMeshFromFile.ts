///////////////////////////////////////////////////////////
// CAPTAIN OBVIOUS HERE:
// this can only be used in a NODE ENVIRONMENT, do not use to import in the client as fs is not available.

import fs from "fs";
import path from "path";
import { NavMeshLoader, NavMesh } from "../../shared/Libs/yuka-min";

export default async function loadNavMeshFromFile(fileNameNavMesh: string): Promise<NavMesh> {
    const url = path.join(__dirname, "../../../public/models/navmesh/" + fileNameNavMesh + ".glb");
    console.log(url);
    const data = await fs.readFileSync(url);
    const loader = new NavMeshLoader();
    return loader.parse(data.buffer, "", { mergeConvexRegions: false }).then((navmesh) => {
        return navmesh;
    });
}
