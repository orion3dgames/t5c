import { Scene, MeshBuilder, Vector3, StandardMaterial, MultiMaterial, Texture, HemisphericLight } from "@babylonjs/core";

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

            if (m.name == "ground") { //dont check for collisions, dont allow for raycasting to detect it(cant land on it)
                m.checkCollisions = true;
                m.isPickable = false;
            }

        });

     }


    //Load all necessary meshes for the environment
    public async _loadAsset() {

        let allMeshes = [];

        //loads game environment
        let plane = MeshBuilder.CreateGround("ground", { "width": 400, "height": 400 }, this._scene); 
        plane.scaling = new Vector3(.2,.2,.2);
        plane.position._y = -5;

        // Set plane texture
        let floorPlane = new StandardMaterial('floorTexturePlane', this._scene);
        let floorTexture = new Texture('./ground.jpg', this._scene);
        floorTexture.uScale = 5.0;
        floorTexture.vScale = 5.0;
        floorPlane.diffuseTexture = floorTexture;
        floorPlane.backFaceCulling = false; // Always show the front and the back of an element

        let materialPlane = new MultiMaterial('materialPlane', this._scene);
        materialPlane.subMaterials.push(floorPlane);
        plane.material = materialPlane;

        allMeshes.push(plane);
        

        return {
            allMeshes: allMeshes,
        }

    }

}