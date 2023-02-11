import { Scene } from "@babylonjs/core/scene";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { bytesToSize } from "../../shared/Utils";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import loadNavMeshFromString from "../../shared/Utils/loadNavMeshFromString";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { WaterMaterial } from "@babylonjs/materials/water";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";

export class Environment {
    private _scene: Scene;
    private _shadow: CascadedShadowGenerator;
    private _assetsContainer;
    public allMeshes;
    private _loadingTxt;

    constructor(scene: Scene, shadow: CascadedShadowGenerator, _assetsContainer) {
        this._scene = scene;
        this._shadow = shadow;
        this._assetsContainer = _assetsContainer;
        this._loadingTxt = window.document.getElementById("loadingTextDetails");
    }

    private showLoadingMessage(msg) {
        if (this._loadingTxt) {
            this._loadingTxt.innerHTML = msg;
        }
    }

    public async loadNavMesh() {
        this.showLoadingMessage("navmesh: loading");
        let navmesh = await loadNavMeshFromString(global.T5C.currentLocation.key);
        this.showLoadingMessage("navmesh: loaded");
        return navmesh;
    }

    public async loadAssets() {
        /*
        // add plane
        var texture = new Texture("./textures/0088-green-grass-texture-seamless-hr.jpg");
        var grassMaterial = new StandardMaterial("grassMaterial");
        grassMaterial.diffuseTexture = texture;
        const sphere = MeshBuilder.CreateCylinder("entity_selected", { diameter: 100, height: 0.01 }, this._scene);
        sphere.position = new Vector3(0, -0.01, 0);
        sphere.material = grassMaterial;
        sphere.receiveShadows = true;*/

        // load all models that could be reused
        let modelsToLoad = ["player_hobbit", "monster_unicorn", "monster_bear"];
        for (const model of modelsToLoad) {
            this._assetsContainer[model] = await SceneLoader.LoadAssetContainerAsync(
                "./models/",
                model + ".glb",
                this._scene,
                (progress) => {
                    this.showLoadingMessage(model + ": " + bytesToSize(progress.loaded));
                }
            );
        }

        // load environment model (doesnt need to be reused later, so let's import it directly)
        let environmentModel = [global.T5C.currentLocation.mesh];
        for (const model of environmentModel) {
            this._assetsContainer[model] = await SceneLoader.ImportMeshAsync(
                null,
                "./models/",
                model + ".glb",
                this._scene,
                (progress) => {
                    this.showLoadingMessage(model + ": " + bytesToSize(progress.loaded));
                }
            );
        }

        // loading materials
        this.showLoadingMessage("materials: loaded");

        // debug circle inaactive
        var material = new StandardMaterial("debug_entity_neutral");
        material.alpha = 0.5;
        material.diffuseColor = new Color3(1.0, 1.0, 1.0);

        // debug circle active
        var material = new StandardMaterial("debug_entity_active");
        material.alpha = 0.5;
        material.diffuseColor = new Color3(1.0, 0, 0);

        // entity selected circle
        var texture = new Texture("./images/selected_circle_green.png");
        texture.hasAlpha = true;
        var material = new StandardMaterial("entity_selected");
        material.diffuseTexture = texture;
        material.useAlphaFromDiffuseTexture = true;

        // particle 01 texture
        let particle_01Txt = new Texture("textures/particle_01.png", this._scene);
    }

    //What we do once the environment assets have been imported
    //handles setting the necessary flags for collision and trigger meshes,
    public async prepareAssets() {

        /*
        var skybox = CreateBox("skyBox", {width: 1000, height: 1000, depth: 1000});
        var skyboxMaterial = new StandardMaterial("skyBox");
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new CubeTexture("textures/skybox", this._scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;*/

        // Water
        var waterMesh = CreateGround("waterMesh", { width: 512, height: 512, subdivisions: 32 }, this._scene);
        waterMesh.position = new Vector3(0, -2, 0);
        
        var water = new WaterMaterial("water", this._scene);
        water.bumpTexture = new Texture("textures/waterbump.jpg", this._scene);
        
        // Water properties
        water.backFaceCulling = true;
        water.windForce = -5;
        water.waveHeight = 0.2;
        water.bumpHeight = 0.05;
        water.waterColor = Color3.FromInts(0, 157, 255);
        water.colorBlendFactor = 0.5;
        waterMesh.material = water;

        //water.addToRenderList(skybox);

        // instantiate the scene
        let key = global.T5C.currentLocation.mesh;
        let env = this._assetsContainer[key].meshes[0];
        this.allMeshes = env.getChildMeshes();

        //Loop through all environment meshes that were imported
        this.allMeshes.forEach((m) => {
            // default values
            m.checkCollisions = false;
            m.isPickable = false;

            if (m.getClassName() !== "InstancedMesh") {
            }

            if (m.name.includes("Preview")) {
                m.dispose();
            }

            if (m.name.includes("New Terrain 1")) {
                m.receiveShadows = true;

                // Add skybox and ground to the reflection and refraction
                water.addToRenderList(m);
            }

            //trigger meshes
            if (m.name.includes("trigger")) {
                m.isVisible = false;
                m.isPickable = false;
                m.checkCollisions = false;
                m.receiveShadows = false;

                if (m.name.includes("teleport_lh_town")) {
                    m.metadata.location = "lh_town";
                }

                if (m.name.includes("teleport_lh_dungeon_01")) {
                    m.metadata.location = "lh_dungeon_01";
                }

                m.name = "teleport";
            }
        });
    }
}
