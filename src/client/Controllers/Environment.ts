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
import { Sound } from "@babylonjs/core/Audio/sound";
import { AssetsManager, BinaryFileAssetTask, ContainerAssetTask, CubeTextureAssetTask, HDRCubeTextureAssetTask, MeshAssetTask, TextFileAssetTask, TextureAssetTask } from "@babylonjs/core/Misc/assetsManager";

export class Environment {
    private _scene: Scene;
    private _shadow: CascadedShadowGenerator;
    private _assetsManager:AssetsManager;
    private _assetsContainer;
    public allMeshes;
    private _loadingTxt;

    constructor(scene: Scene, shadow: CascadedShadowGenerator, _assetsContainer) {
        this._scene = scene;
        this._shadow = shadow;
        this._assetsContainer = _assetsContainer;
        this._loadingTxt = window.document.getElementById("loadingTextDetails");

        // Assets manager
	    this._assetsManager = new AssetsManager(scene);
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

        let environmentModel = global.T5C.currentLocation.mesh;

        let assetsToLoad = [

            // sounds
            { name: "enemy_attack_1", filename: "enemy_attack_1.wav", extension: "wav" }, 
            { name: "enemy_attack_2", filename: "enemy_attack_2.wav", extension: "wav" }, 
            { name: "fire_attack_1", filename: "fire_attack_1.wav", extension: "wav" }, 
            { name: "fire_attack_2", filename: "fire_attack_2.wav", extension: "wav" }, 
            { name: "heal_1", filename: "heal_1.wav", extension: "wav" }, 
            { name: "music", filename: "music.mp3", extension: "mp3" }, 
            { name: "player_walking", filename: "player_walking.wav", extension: "wav" }, 

            // models
            { name: "player_hobbit", filename: "player_hobbit.glb", extension: "glb", container: true }, 
            { name: "monster_unicorn", filename: "monster_unicorn.glb", extension: "glb", container: true  }, 
            { name: "monster_bear", filename: "monster_bear.glb", extension: "glb", container: true }, 

            // textures
            { name: "selected_circle_green", filename: "selected_circle_green.png", extension: "png" },

            // environment
            { name: environmentModel, filename: environmentModel+".glb", extension: "glb", container: false }, 
        ];

        let assets: string[] = [];
        assetsToLoad.forEach((obj) => {
            let assetTask;
            switch(obj.extension) {
                case "png":
                case "jpg":
                case "jpeg":
                case "gif":
                    assetTask = this._assetsManager.addTextureTask(obj.name, './images/' + obj.filename);
                    break;
                case "dds":
                    assetTask = this._assetsManager.addCubeTextureTask(obj.name, './images/' + obj.filename);
                    break;
                case "hdr":
                    assetTask = this._assetsManager.addHDRCubeTextureTask(obj.name, './images/' + obj.filename, 512);
                    break;
                case "mp3":
                case "wav":
                    assetTask = this._assetsManager.addBinaryFileTask(obj.name, './sounds/' + obj.filename);
                    break;
                case "babylon":
                case "gltf":
                case "glb":
                case "obj":
                    if(obj.container){
                        assetTask = this._assetsManager.addContainerTask(obj.name, "", "", './models/' + obj.filename)
                    }else{
                        assetTask = this._assetsManager.addMeshTask(obj.name, "", "", './models/' + obj.filename)
                    }
                    break;
                case "json":
                case "txt":
                    assetTask = this._assetsManager.addTextFileTask(obj.name, './data/' + obj.filename);
                    break;
                default:
                    console.log('Error loading asset "' + obj.name + '". Unrecognized file extension "' + obj.extension + '"');
                    break;
            }

            assetTask.onSuccess = (task) => {
                switch(task.constructor) {
                    case TextureAssetTask:
                    case CubeTextureAssetTask:
                    case HDRCubeTextureAssetTask:
                        this._assetsContainer[task.name] = task.texture;
                        break;
                    case BinaryFileAssetTask:
                        this._assetsContainer[task.name] = task.data;
                        break;
                    case ContainerAssetTask:
                        this._assetsContainer[task.name] = task.loadedContainer;
                        break;
                    case MeshAssetTask:
                        console.log(task);
                        this._assetsContainer[task.name] = task;
                        break;
                    case TextFileAssetTask:
                        this._assetsContainer[task.name] = task.text;
                        break;
                    default:
                        console.log('Error loading asset "' + task.name + '". Unrecognized AssetManager task type.');
                        break;
                }
            };

            assetTask.onError = (task, message, exception) => {
                console.log(message, exception);
            };

        });

        this._assetsManager.onProgress = (remainingCount, totalCount, lastFinishedTask) => {
            this.showLoadingMessage(lastFinishedTask.name + ": "+remainingCount+"/"+totalCount);
        };

        this._assetsManager.onFinish = () => {
            this.showLoadingMessage("loading complete");
        };

        await this._assetsManager.loadAsync();

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

        // start  music
        let soundData = this._assetsContainer['music'];
        let sound = new Sound("music", soundData, this._scene, function(){ sound.play() }, {
            volume: 0.3
        });

        // instantiate the scene
        let key = global.T5C.currentLocation.mesh;
        this.allMeshes = this._assetsContainer[key].loadedMeshes;

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
