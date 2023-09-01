import { Scene } from "@babylonjs/core/scene";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import loadNavMeshFromString from "../../shared/Utils/loadNavMeshFromString";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { WaterMaterial } from "@babylonjs/materials/water";
import { Sound } from "@babylonjs/core/Audio/sound";
import {
    AssetsManager,
    BinaryFileAssetTask,
    ContainerAssetTask,
    CubeTextureAssetTask,
    HDRCubeTextureAssetTask,
    ImageAssetTask,
    MeshAssetTask,
    TextFileAssetTask,
    TextureAssetTask,
} from "@babylonjs/core/Misc/assetsManager";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Tags } from "@babylonjs/core/Misc/tags";
import { AuthController } from "./AuthController";
import { dataDB } from "../../shared/Data/dataDB";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

type Asset = {
    name: string;
    filename: string;
    extension: string;
    instantiate?: boolean;
};

export class Environment {
    private _scene: Scene;
    private _shadow: CascadedShadowGenerator;
    private _assetsManager: AssetsManager;
    private _loadedAssets;
    public allMeshes;
    private _loadingTxt;
    private _auth;

    constructor(scene: Scene, shadow: CascadedShadowGenerator, _loadedAssets) {
        this._scene = scene;
        this._shadow = shadow;
        this._loadedAssets = _loadedAssets;
        this._loadingTxt = window.document.getElementById("loadingTextDetails");
        this._auth = AuthController.getInstance();

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
        let navmesh = await loadNavMeshFromString(this._auth.currentLocation.key);
        this.showLoadingMessage("navmesh: loaded");
        return navmesh;
    }

    public async loadAssets() {
        let environmentName = this._auth.currentLocation.key;
        let environmentModel = this._auth.currentLocation.mesh;

        let assetsToLoad = [
            // sounds
            //{ name: "SOUND_enemy_attack_1", filename: "enemy_attack_1.wav", extension: "wav" },
            //{ name: "SOUND_enemy_attack_2", filename: "enemy_attack_2.wav", extension: "wav" },
            //{ name: "SOUND_fire_attack_1", filename: "fire_attack_1.wav", extension: "wav" },
            //{ name: "SOUND_fire_attack_2", filename: "fire_attack_2.wav", extension: "wav" },
            //{ name: "SOUND_heal_1", filename: "heal_1.wav", extension: "wav" },
            //{ name: "MUSIC_01", filename: "music.mp3", extension: "mp3" },
            //{ name: "SOUND_player_walking", filename: "player_walking.wav", extension: "wav" },

            // textures
            { name: "TXT_selected_circle_green", filename: "selected_circle_green.png", extension: "png", type: "texture" },
            { name: "TXT_particle_01", filename: "particle_01.png", extension: "png", type: "texture" },

            // environment
            {
                name: "ENV_" + environmentName,
                filename: "environment/" + environmentModel + ".glb",
                extension: "glb",
                instantiate: false,
            },
        ];

        // add abilities (icons)
        let abilities = dataDB.load("abilities");
        if (abilities) {
            for (let key in abilities) {
                let el = abilities[key];
                assetsToLoad.push({ name: el.icon, filename: "icons/" + el.icon + ".png", extension: "png", type: "image" });
            }
        }

        // add items (icons & mesh)
        let items = dataDB.load("items");
        if (items) {
            for (let key in items) {
                let el = items[key];
                assetsToLoad.push({ name: el.icon, filename: "icons/" + el.icon + ".png", extension: "png", type: "image" });
                assetsToLoad.push({ name: "ITEM_" + el.key, filename: "items/" + el.key + ".glb", extension: "glb", instantiate: true });
            }
        }

        // add races (mesh)
        let races = dataDB.load("races");
        if (races) {
            for (let key in races) {
                let el = races[key];
                assetsToLoad.push({ name: "RACE_" + el.key, filename: "races/" + el.key + ".glb", extension: "glb", instantiate: true });
                assetsToLoad.push({ name: el.icon, filename: "portrait/" + el.icon + ".png", extension: "png", type: "image" });
            }
        }

        assetsToLoad.forEach((obj) => {
            let assetTask;
            switch (obj.extension) {
                case "png":
                case "jpg":
                case "jpeg":
                case "gif":
                    if (obj.type === "texture") {
                        assetTask = this._assetsManager.addTextureTask(obj.name, "./textures/" + obj.filename);
                    } else if (obj.type === "image") {
                        assetTask = this._assetsManager.addImageTask(obj.name, "./images/" + obj.filename);
                    }
                    break;

                case "dds":
                    assetTask = this._assetsManager.addCubeTextureTask(obj.name, "./images/" + obj.filename);
                    break;

                case "hdr":
                    assetTask = this._assetsManager.addHDRCubeTextureTask(obj.name, "./images/" + obj.filename, 512);
                    break;

                case "mp3":
                case "wav":
                    assetTask = this._assetsManager.addBinaryFileTask(obj.name, "./sounds/" + obj.filename);
                    break;

                case "babylon":
                case "gltf":
                case "glb":
                case "obj":
                    if (obj.instantiate) {
                        assetTask = this._assetsManager.addContainerTask(obj.name, "", "", "./models/" + obj.filename);
                    } else {
                        assetTask = this._assetsManager.addMeshTask(obj.name, "", "", "./models/" + obj.filename);
                    }
                    break;

                case "json":
                case "txt":
                    assetTask = this._assetsManager.addTextFileTask(obj.name, "./data/" + obj.filename);
                    break;

                default:
                    console.error('Error loading asset "' + obj.name + '". Unrecognized file extension "' + obj.extension + '"');
                    break;
            }

            assetTask.onSuccess = (task) => {
                switch (task.constructor) {
                    case TextureAssetTask:
                    case CubeTextureAssetTask:
                    case HDRCubeTextureAssetTask:
                        this._loadedAssets[task.name] = task.texture;
                        break;
                    case ImageAssetTask:
                        this._loadedAssets[task.name] = task.url;
                        break;
                    case BinaryFileAssetTask:
                        this._loadedAssets[task.name] = task.data;
                        break;
                    case ContainerAssetTask:
                        this._loadedAssets[task.name] = task.loadedContainer;
                        break;
                    case MeshAssetTask:
                        this._loadedAssets[task.name] = task;
                        break;
                    case TextFileAssetTask:
                        this._loadedAssets[task.name] = task.text;
                        break;
                    default:
                        console.error('Error loading asset "' + task.name + '". Unrecognized AssetManager task type.');
                        break;
                }
            };

            assetTask.onError = (task, message, exception) => {
                console.log(message, exception);
            };
        });

        this._assetsManager.onProgress = (remainingCount, totalCount, lastFinishedTask) => {
            let loadingMsg = (((totalCount - remainingCount) / totalCount) * 100).toFixed(0) + "%";
            this.showLoadingMessage(loadingMsg);
        };

        this._assetsManager.onFinish = () => {
            console.log("loading complete", this._loadedAssets);
            this.showLoadingMessage("100%");
        };

        await this._assetsManager.loadAsync();

        // debug circle inaactive
        var material = new StandardMaterial("debug_entity_neutral");
        material.diffuseColor = new Color3(0, 1, 0);
        material.alpha = 0.1;

        // debug circle active
        var material = new StandardMaterial("debug_entity_active");
        material.diffuseColor = new Color3(1.0, 0, 0);
        material.alpha = 0.1;

        // entity selected circle
        var texture = this._loadedAssets["TXT_selected_circle_green"];
        texture.hasAlpha = true;
        var material = new StandardMaterial("entity_selected");
        material.diffuseTexture = texture;
        material.useAlphaFromDiffuseTexture = true;
    }

    public async preloadAssets() {
        let assetsToLoad = [
            // sounds
            /*
            { name: "SOUND_enemy_attack_1", filename: "enemy_attack_1.wav", extension: "wav" },
            { name: "SOUND_enemy_attack_2", filename: "enemy_attack_2.wav", extension: "wav" },
            { name: "SOUND_fire_attack_1", filename: "fire_attack_1.wav", extension: "wav" },
            { name: "SOUND_fire_attack_2", filename: "fire_attack_2.wav", extension: "wav" },
            { name: "SOUND_heal_1", filename: "heal_1.wav", extension: "wav" },
            { name: "MUSIC_01", filename: "music.mp3", extension: "mp3" },
            { name: "SOUND_player_walking", filename: "player_walking.wav", extension: "wav", instantiate: false },*/

            // textures
            { name: "TXT_selected_circle_green", filename: "selected_circle_green.png", extension: "png", type: "texture" },
            { name: "TXT_particle_01", filename: "particle_01.png", extension: "png", type: "texture", instantiate: false },
        ];

        // add locations
        let locations = dataDB.load("locations");
        if (locations) {
            for (let key in locations) {
                let el = locations[key];
                assetsToLoad.push({ name: "ENV_" + el.key, filename: "environment/" + el.mesh + ".glb", extension: "glb", type: "mesh" });
            }
        }

        // add abilities (icons)
        let abilities = dataDB.load("abilities");
        if (abilities) {
            for (let key in abilities) {
                let el = abilities[key];
                assetsToLoad.push({ name: el.icon, filename: "icons/" + el.icon + ".png", extension: "png", type: "image" });
            }
        }

        // add items (icons & mesh)
        let items = dataDB.load("items");
        if (items) {
            for (let key in items) {
                let el = items[key];
                assetsToLoad.push({ name: el.icon, filename: "icons/" + el.icon + ".png", extension: "png", type: "image" });
                assetsToLoad.push({ name: "ITEM_" + el.key, filename: "items/" + el.key + ".glb", extension: "glb", type: "mesh", instantiate: true });
            }
        }

        // add races (mesh)
        let races = dataDB.load("races");
        if (races) {
            for (let key in races) {
                let el = races[key];
                assetsToLoad.push({ name: "RACE_" + el.key, filename: "races/" + el.key + ".glb", extension: "glb", type: "mesh", instantiate: true });
                assetsToLoad.push({ name: el.icon, filename: "portrait/" + el.icon + ".png", extension: "png", type: "image" });
            }
        }

        assetsToLoad.forEach((obj) => {
            let assetTask;
            switch (obj.extension) {
                case "png":
                case "jpg":
                case "jpeg":
                case "gif":
                    if (obj.type === "texture") {
                        assetTask = this._assetsManager.addTextureTask(obj.name, "./textures/" + obj.filename);
                    } else if (obj.type === "image") {
                        assetTask = this._assetsManager.addImageTask(obj.name, "./images/" + obj.filename);
                    }
                    break;

                case "dds":
                    assetTask = this._assetsManager.addCubeTextureTask(obj.name, "./images/" + obj.filename);
                    break;

                case "hdr":
                    assetTask = this._assetsManager.addHDRCubeTextureTask(obj.name, "./images/" + obj.filename, 512);
                    break;

                case "mp3":
                case "wav":
                    assetTask = this._assetsManager.addBinaryFileTask(obj.name, "./sounds/" + obj.filename);
                    break;

                case "babylon":
                case "gltf":
                case "glb":
                case "obj":
                    if (obj.instantiate) {
                        assetTask = this._assetsManager.addContainerTask(obj.name, "", "", "./models/" + obj.filename);
                    } else {
                        assetTask = this._assetsManager.addMeshTask(obj.name, "", "", "./models/" + obj.filename);
                    }
                    break;

                case "json":
                case "txt":
                    assetTask = this._assetsManager.addTextFileTask(obj.name, "./data/" + obj.filename);
                    break;

                default:
                    console.error('Error loading asset "' + obj.name + '". Unrecognized file extension "' + obj.extension + '"');
                    break;
            }

            assetTask.onSuccess = (task) => {
                switch (task.constructor) {
                    case TextureAssetTask:
                    case CubeTextureAssetTask:
                    case HDRCubeTextureAssetTask:
                        this._loadedAssets[task.name] = task.texture;
                        break;
                    case ImageAssetTask:
                        this._loadedAssets[task.name] = task.url;
                        break;
                    case BinaryFileAssetTask:
                        this._loadedAssets[task.name] = task.data;
                        break;
                    case ContainerAssetTask:
                        this._loadedAssets[task.name] = task.loadedContainer;
                        break;
                    case MeshAssetTask:
                        this._loadedAssets[task.name] = task;
                        break;
                    case TextFileAssetTask:
                        this._loadedAssets[task.name] = task.text;
                        break;
                    default:
                        console.error('Error loading asset "' + task.name + '". Unrecognized AssetManager task type.');
                        break;
                }
            };

            assetTask.onError = (task, message, exception) => {
                console.log(message, exception);
            };
        });

        this._assetsManager.onProgress = (remainingCount, totalCount, lastFinishedTask) => {
            let loadingMsg = (((totalCount - remainingCount) / totalCount) * 100).toFixed(0) + "%";
            this.showLoadingMessage(loadingMsg);
        };

        this._assetsManager.onFinish = () => {
            console.log("loading complete", this._loadedAssets);
            this.showLoadingMessage("100%");
        };

        await this._assetsManager.loadAsync();

        // debug circle inaactive
        var material = new StandardMaterial("debug_entity_neutral");
        material.diffuseColor = new Color3(0, 1, 0);
        material.alpha = 0.1;

        // debug circle active
        var material = new StandardMaterial("debug_entity_active");
        material.diffuseColor = new Color3(1.0, 0, 0);
        material.alpha = 0.1;

        // entity selected circle
        var texture = this._loadedAssets["TXT_selected_circle_green"];
        texture.hasAlpha = true;
        var material = new StandardMaterial("entity_selected");
        material.diffuseTexture = texture;
        material.useAlphaFromDiffuseTexture = true;
    }

    public async loadCharacterEditor() {
        let assetsToLoad: any = [];

        let races = dataDB.load("races");
        if (races) {
            for (let key in races) {
                let el = races[key];
                assetsToLoad.push({ name: "RACE_" + el.key, filename: "races/" + el.key + ".glb", extension: "glb", instantiate: true });
            }
        }

        assetsToLoad.forEach((obj) => {
            let assetTask;
            switch (obj.extension) {
                case "glb":
                    assetTask = this._assetsManager.addContainerTask(obj.name, "", "", "./models/" + obj.filename);
                    break;
                default:
                    console.error('Error loading asset "' + obj.name + '". Unrecognized file extension "' + obj.extension + '"');
                    break;
            }

            assetTask.onSuccess = (task) => {
                switch (task.constructor) {
                    case ContainerAssetTask:
                        this._loadedAssets[task.name] = task.loadedContainer;
                        break;
                    default:
                        console.error('Error loading asset "' + task.name + '". Unrecognized AssetManager task type.');
                        break;
                }
            };

            assetTask.onError = (task, message, exception) => {
                console.log(message, exception);
            };
        });

        this._assetsManager.onProgress = (remainingCount, totalCount, lastFinishedTask) => {
            this.showLoadingMessage("loading: " + lastFinishedTask.name);
        };

        this._assetsManager.onFinish = () => {
            console.log("loading complete", this._loadedAssets);
            this.showLoadingMessage("loading complete");
        };

        await this._assetsManager.loadAsync();
    }

    //What we do once the environment assets have been imported
    //handles setting the necessary flags for collision and trigger meshes,
    public async prepareAssets() {
        /*
        if (this._auth.currentLocation.waterPlane) {
            // Water
            var waterMesh = CreateGround("waterMesh", { width: 512, height: 512, subdivisions: 32 }, this._scene);
            waterMesh.position = new Vector3(0, -4, 0);

            var water = new WaterMaterial("water", this._scene);
            water.bumpTexture = new Texture("textures/waterbump.jpg", this._scene);

            // Water properties
            water.backFaceCulling = true;
            water.windForce = 0.1;
            water.waveHeight = 0.6;
            water.bumpHeight = 0.5;
            water.waterColor = Color3.FromInts(0, 157, 255);
            water.colorBlendFactor = 0.5;
            waterMesh.material = water;
        }*/

        // start  music
        /*
        let soundData = this._loadedAssets['music'];
        let sound = new Sound("music", soundData, this._scene, function(){ sound.play() }, {
            volume: 0.3
        });*/

        // instantiate the scene
        let key = "ENV_" + this._auth.currentLocation.mesh;
        this.allMeshes = this._loadedAssets[key].loadedMeshes;

        //Loop through all environment meshes that were imported
        this.allMeshes.forEach((m: Mesh) => {
            // default values
            m.checkCollisions = false;
            m.isPickable = false;
            m.receiveShadows = true;

            m.metadata = {
                type: "environment",
            };
            //m.unfreezeWorldMatrix();
            //m.doNotSyncBoundingInfo = true;

            /*
            if (m.getClassName() !== "InstancedMesh") {
            }

            if (m.name.includes("Preview")) {
                m.dispose();
            }

            if (m.name.includes("castShadows")) {
                this._shadow.addShadowCaster(m);
            }

            if (m.name.includes("seafloor")) {
                //m.receiveShadows = true;
                // Add skybox and ground to the reflection and refraction
                //water.addToRenderList(m);
            }
            */
        });
    }
}
