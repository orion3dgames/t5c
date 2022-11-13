import { Scene, SceneLoader} from "@babylonjs/core";

export class Environment {

    private _scene: Scene;

    constructor(scene: Scene) {

        this._scene = scene;

    }

    //What we do once the environment assets have been imported
    //handles setting the necessary flags for collision and trigger meshes,
    //sets up the lantern objects
    //creates the firework particle systems for end-game
     public async load() {
       
        const assets = await this._loadAsset();

        //Loop through all environment meshes that were imported
        assets.allMeshes.forEach(m => {
            m.receiveShadows = true;
            m.checkCollisions = true;

            if (m.name == "ground") { //dont check for collisions, dont allow for raycasting to detect it(cant land on it)
                m.checkCollisions = false;
                m.isPickable = false;
            }

            //areas that will use box collisions
            if (m.name.includes("stairs") || m.name == "cityentranceground" || m.name == "fishingground.001" || m.name.includes("lilyflwr")) {
                m.checkCollisions = false;
                m.isPickable = false;
            }
            //collision meshes
            if (m.name.includes("collision")) {
                m.isVisible = false;
                m.isPickable = true;
            }
            //trigger meshes
            if (m.name.includes("Trigger")) {
                m.isVisible = false;
                m.isPickable = false;
                m.checkCollisions = false;
            }
        });

     }


    //Load all necessary meshes for the environment
    public async _loadAsset() {
        //loads game environment
        const result = await SceneLoader.ImportMeshAsync(null, "./models/", "town.glb", this._scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();

        return {
            env: env,
            allMeshes: allMeshes,
            //animationGroups: animGroup
        }
    }

}