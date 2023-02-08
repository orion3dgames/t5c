import { Scene } from "@babylonjs/core/scene";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { bytesToSize } from "../../shared/Utils";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import loadNavMeshFromString from "../../shared/Utils/loadNavMeshFromString";

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
        // load all models
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
