import { Scene } from "@babylonjs/core/scene";
import { Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { BakedVertexAnimationManager } from "@babylonjs/core/BakedVertexAnimation/bakedVertexAnimationManager";
import { VertexAnimationBaker } from "@babylonjs/core/BakedVertexAnimation/vertexAnimationBaker";
import { Engine } from "@babylonjs/core/Engines/engine";
import { randomNumberInRange, request } from "../../shared/Utils";

import State from "./Screens";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";

import { mergeMesh, calculateRanges, bakeVertexData, setAnimationParameters, mergeMeshAndSkeleton } from "../../shared/Utils/vatUtils";

class JavascriptDataDownloader {
    private data;
    constructor(data = {}) {
        this.data = data;
    }
    download(type_of = "text/plain", filename = "data.txt") {
        let body = document.body;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(
            new Blob([JSON.stringify(this.data, null, 2)], {
                type: type_of,
            })
        );
        a.setAttribute("download", filename);
        body.appendChild(a);
        a.click();
        body.removeChild(a);
    }
}

export class DebugScene {
    public _engine: Engine;
    public _scene: Scene;
    public _newState: State;
    public _button: Button;
    public _ui;

    public results;

    public PLANE_SIZE = 20;
    public INST_COUNT = 100;
    public PICKED_ANIMS = ["Walk", "Run", "Idle", "Sword_Slash"];
    public URL_MESH = "male_adventurer.glb";

    public models = [];
    public vatManager;
    public playerMesh;

    public animationRanges;
    public animationGroups;

    constructor() {
        this._newState = State.NULL;
    }

    public async createScene(app) {
        this._engine = app.engine;

        let scene = new Scene(app.engine);
        scene.clearColor = new Color4(0, 0, 0, 1);

        var camera = new ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 3, new Vector3(0, 3, 3), scene);
        camera.attachControl(app.canvas, true);

        camera.lowerRadiusLimit = 2;
        camera.upperRadiusLimit = 10;
        camera.wheelDeltaPercentage = 0.01;

        var light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
        light.intensity = 0.6;
        light.specular = Color3.Black();

        // Built-in 'ground' shape.
        const ground = MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);

        // load scene
        this._scene = scene;

        // add ui
        this._ui = AdvancedDynamicTexture.CreateFullscreenUI("UI_Names", true, this._scene);

        // add FPS
        var label = new TextBlock("FPS");
        label.text = "FPS: " + this._engine.getFps();
        label.color = "white";
        label.top = "15px;";
        label.left = "15px;";
        label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        label.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._ui.addControl(label);

        this._scene.registerBeforeRender(() => {
            label.text = "FPS: " + this._engine.getFps();
        });

        // add VAT manager
        this.vatManager = new BakedVertexAnimationManager(this._scene);
        this._scene.registerBeforeRender(() => {
            this.vatManager.time += this._scene.getEngine().getDeltaTime() / 1000.0;
        });

        // load weapon
        const weaponLoad = await SceneLoader.ImportMeshAsync("", "./models/items/", "sword_01.glb", this._scene);
        const weaponMesh = weaponLoad.meshes[0];
        const weaponMeshMerged = await mergeMesh(weaponMesh);

        //////////////////////////////////////////////////////////
        // load mesh
        //await this.loadMesh("male_enemy");
        await this.loadMesh("male_adventurer");

        ///
        const createInst = (id) => {
            const playerInstance = this.playerMesh.createInstance("player_" + id);
            playerInstance.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);
            let animaToPlay = Math.floor(Math.random() * this.animationGroups.length);
            setAnimationParameters(
                playerInstance.instancedBuffers.bakedVertexAnimationSettingsInstanced,
                animaToPlay,
                this.animationRanges,
                this.animationGroups
            );
            playerInstance.position.x = randomNumberInRange(-3, 3);
            playerInstance.position.z = randomNumberInRange(-3, 3);
            playerInstance.rotation.y = 0;
            this.createLabel(playerInstance, id);

            // attack weapon
            if (weaponMeshMerged) {
                const weapon = weaponMeshMerged.createInstance("player_" + id + "_sword");
                let bone = playerInstance.skeleton.bones[37];
                weapon.attachToBone(bone, playerInstance);
                console.log(weapon);
                /*
                let boneId = this._entity.bones[key];
                    let bone = this._skeleton.bones[boneId];
                    const weapon = this._loadedAssets["ITEM_" + e.key].instantiateModelsToScene((name) => "player_" + e.key);
                    const weaponMesh = weapon.rootNodes[0];
                    weaponMesh.parent = this.playerMesh;
                    weaponMesh.attachToBone(bone, this.playerMesh); */
            }
        };

        for (let i = 0; i < this.INST_COUNT; i++) {
            console.log("CREATE INSTANCE ID: " + i);
            createInst(i + "");
        }
    }

    async loadMesh(key) {
        const { meshes, animationGroups, skeletons } = await SceneLoader.ImportMeshAsync("", "./models/races/", key + ".glb", this._scene);
        const selectedAnimationGroups = animationGroups.filter((ag) => this.PICKED_ANIMS.includes(ag.name));
        const skeleton = skeletons[0];
        const root = meshes[0];

        // reset position & rotation
        // not sure why?
        root.position.setAll(0);
        root.scaling.setAll(1);
        root.rotationQuaternion = null;
        root.rotation.setAll(0);

        // calculate animations ranges
        const ranges = calculateRanges(selectedAnimationGroups);

        // merge mesh
        const merged = mergeMeshAndSkeleton(root, skeleton);

        // save data
        this.playerMesh = merged;
        this.animationRanges = ranges;
        this.animationGroups = selectedAnimationGroups;

        // disable & hide root mesh
        root.setEnabled(false);
        this.playerMesh.isVisible = false;

        // setup vat
        if (merged) {
            // note sure what's happening here
            merged.registerInstancedBuffer("bakedVertexAnimationSettingsInstanced", 4);
            merged.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);

            // bake VAT
            merged.bakedVertexAnimationManager = this.vatManager;
            merged.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);
            setAnimationParameters(merged.instancedBuffers.bakedVertexAnimationSettingsInstanced, 0, this.animationRanges, this.animationGroups);

            // bake vertex data
            //this.bakeToJson(merged, selectedAnimationGroups);

            // load prebaked vat animations
            const b = new VertexAnimationBaker(this._scene, merged);
            let req = await request("get", "./models/races/male_adventurer.json", {}, false, { headers: { "Content-Type": "application/json" } });
            let bufferFromMesh = b.loadBakedVertexDataFromJSON(JSON.parse(req.data));
            this.vatManager.texture = b.textureFromBakedVertexData(bufferFromMesh);

            //dispose resources
            meshes.forEach((m) => m.dispose(false, true));
            this.animationGroups.forEach((ag) => ag.dispose());
            skeletons.forEach((s) => s.dispose());
        }
    }

    async bakeToJson(merged, selectedAnimationGroups) {
        const b = new VertexAnimationBaker(this._scene, merged);
        const bufferFromMesh = await bakeVertexData(merged, selectedAnimationGroups);
        let vertexDataJson = b.serializeBakedVertexDataToJSON(bufferFromMesh);
        new JavascriptDataDownloader(vertexDataJson).download();
    }

    createLabel(mesh, delta) {
        var label = new TextBlock("player_chat_label_" + delta);
        label.text = "Pirate " + delta;
        label.color = "white";
        label.paddingLeft = "5px;";
        label.paddingTop = "5px";
        label.paddingBottom = "5px";
        label.paddingRight = "5px";
        label.textWrapping = TextWrapping.WordWrap;
        label.resizeToFit = true;
        this._ui.addControl(label);
        label.linkWithMesh(mesh);
        label.linkOffsetY = -130;
    }
}
