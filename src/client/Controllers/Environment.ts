import { Scene } from "@babylonjs/core/scene";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { WaterMaterial } from "@babylonjs/materials";

export class Environment {

    private _scene: Scene;
    private _shadow: CascadedShadowGenerator;
    public allMeshes;

    constructor(scene: Scene, shadow:CascadedShadowGenerator) {

        this._scene = scene;
        this._shadow = shadow;
    
    }

    //What we do once the environment assets have been imported
    //handles setting the necessary flags for collision and trigger meshes,
     public async load(allMeshes) {
       
        const assets = await this._loadAsset();

        this.allMeshes = assets.allMeshes;

        //Loop through all environment meshes that were imported
        this.allMeshes.forEach(m => {
            
            // default values
            m.checkCollisions = false;
            m.isPickable = true;
   
            if (m.getClassName() !== 'InstancedMesh') {
                m.receiveShadows = true;
            }

            if (m.name.includes("Preview")) {
                m.dispose();
            }

            if (m.name.includes("shadow")) {
                //this._shadow.addShadowCaster(m);
            }

            //trigger meshes
            if (m.name.includes("trigger")) {

                m.isVisible = false;
                m.isPickable = false;
                m.checkCollisions = false;
                m.receiveShadows = false;
         
                if(m.name.includes("teleport_lh_town")){
                    m.metadata.location = "lh_town";
                }

                if(m.name.includes("teleport_lh_dungeon_01")){
                    m.metadata.location = "lh_dungeon_01";
                }

                m.name = "teleport";
            }

        });

     }


    //Load all necessary meshes for the environment
    public async _loadAsset() {

        //loads game environment
        const result = await SceneLoader.ImportMeshAsync(null, "./models/", global.T5C.currentLocation.mesh, this._scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();

        return {
            env: env,
            allMeshes: allMeshes
        }
    }

}