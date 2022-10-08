import { Scene, MeshBuilder, Mesh, Vector3, Color3, TransformNode, SceneLoader, ParticleSystem, Color4, Texture, PBRMetallicRoughnessMaterial, VertexBuffer, AnimationGroup, Sound, ExecuteCodeAction, ActionManager, Tags } from "@babylonjs/core";
import { Lantern } from "./lantern";
import { Player } from "./characterController";

export class Environment {
    private _scene: Scene;

    constructor(scene: Scene) {
        this._scene = scene;
    }

    //What we do once the environment assets have been imported
    //handles setting the necessary flags for collision and trigger meshes,
     public async load() {
       
        const assets = await this._loadAsset();

        //Loop through all environment meshes that were imported
        assets.allMeshes.forEach(m => {

            m.receiveShadows = true;
            m.checkCollisions = false;

            console.log(m);

            console.log(m.name);
            if (m.name == "ground") { //dont check for collisions, dont allow for raycasting to detect it(cant land on it)
                m.checkCollisions = false;
                m.isPickable = false;
            }

        });

     }


    //Load all necessary meshes for the environment
    public async _loadAsset() {

        let allMeshes = [];

        //loads game environment
        let plane = MeshBuilder.CreateGround("ground", { "width": 400, "height": 400 }, this._scene); 
        plane.scaling = new Vector3(1,.02,1);

        allMeshes.push(plane);

        return {
            allMeshes: allMeshes,
        }

    }

}