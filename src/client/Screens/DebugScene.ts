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
import { randomNumberInRange } from "../../shared/Utils";

import State from "./Screens";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";

import { mergeMesh, calculateRanges, bakeVertexData, setAnimationParameters, mergeMeshAndSkeleton } from "../Entities/Common/VatHelper";
import AnimationHelper from "../Entities/Common/AnimationHelper";
import { Skeleton } from "@babylonjs/core/Bones/skeleton";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { GameController } from "../Controllers/GameController";

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

const frameOffset = 6;

export class DebugScene {
    public _engine: Engine;
    public _scene: Scene;
    public _game: GameController;
    public _newState: State;
    public _button: Button;
    public _ui;

    public results;

    public PLANE_SIZE = 10;
    public INST_COUNT = 100;
    public PICKED_ANIMS = ["Idle", "Walking_A"];
    public URL_MESH = "male_rogue";
    public RACES = ["male_rogue", "male_mage"];

    public models = [];
    public vatManager;
    public playerMesh;

    public animationRanges;

    public animationGroups;
    public selectedAnimationGroups;

    public skeletonForAnim: Skeleton[] = []; //
    public rootForAnim: TransformNode[] = []; //

    public mainSkeleton: Skeleton;

    constructor() {
        this._newState = State.NULL;
    }

    public async createScene(app) {
        this._engine = app.engine;
        this._game = app;

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
        const ground = MeshBuilder.CreateGround("ground", { width: this.PLANE_SIZE, height: this.PLANE_SIZE }, scene);

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

        // preload assets
        this._game.initializeAssetController();
        await this._game._assetsCtrl.fetchAsset("ITEM_sword_01");
        await this._game._assetsCtrl.fetchAsset("RACE_male_knight");
        await this._game._assetsCtrl.fetchAsset("RACE_male_mage");
        console.log("loading complete", this._game._loadedAssets);

        // add VAT manager
        this.vatManager = new BakedVertexAnimationManager(this._scene);

        // load weapon
        const weaponLoad = this._game._loadedAssets["ITEM_sword_01"];
        const weaponMesh = weaponLoad.meshes[0];
        const weaponMeshMerged = await mergeMesh(weaponMesh);

        // preload skeletons and animation
        await this.prepareMesh(this._game._loadedAssets["RACE_male_knight"], "male_knight");
        //await this.prepareMesh(this._game._loadedAssets["RACE_male_mage"], "male_mage");

        ///
        const createInst = (id, animIndex) => {
            const index = this.RACES[Math.floor(Math.random() * this.RACES.length)];
            const playerInstance = this.playerMesh.createInstance("player_" + id);
            playerInstance.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);
            setAnimationParameters(playerInstance.instancedBuffers.bakedVertexAnimationSettingsInstanced, animIndex, this.animationRanges);
            playerInstance.position.x = randomNumberInRange(-this.PLANE_SIZE, this.PLANE_SIZE);
            playerInstance.position.z = randomNumberInRange(-this.PLANE_SIZE, this.PLANE_SIZE);
            playerInstance.rotation.y = 0;
            this.createLabel(playerInstance, id);

            // attach weapon
            let rand = Math.random();
            if (weaponMeshMerged && rand > 0.5) {
                const weapon = weaponMeshMerged.createInstance("player_" + id + "_sword");
                const skeletonAnim = this.skeletonForAnim[animIndex];
                let bone = skeletonAnim.bones[12];
                weapon.attachToBone(bone, playerInstance);
            }
        };

        for (let i = 0; i < this.INST_COUNT; i++) {
            createInst(i + "", Math.floor(Math.random() * this.selectedAnimationGroups.length));
        }

        this._scene.registerBeforeRender(() => {
            this.vatManager.time += this._scene.getEngine().getDeltaTime() / 1000.0;

            this.skeletonForAnim.forEach((skel) => {
                skel.prepare();
            });

            const frame = this.vatManager.time * 60 + frameOffset;

            this.selectedAnimationGroups.forEach((animationGroup) => {
                animationGroup.goToFrame(frame);
            });
        });

        //
        for (const animationGroup of this.animationGroups) {
            const indexAnim = this.PICKED_ANIMS.indexOf(animationGroup.name);
            if (indexAnim >= 0) {
                AnimationHelper.RetargetAnimationGroupToRoot(animationGroup, this.rootForAnim[indexAnim]);
                AnimationHelper.RetargetSkeletonToAnimationGroup(animationGroup, this.skeletonForAnim[indexAnim]);
                animationGroup.play(true);
            }
        }
    }

    async prepareMesh(asset, key) {
        //const { meshes, animationGroups, skeletons } = await SceneLoader.ImportMeshAsync("", "./models/races/", key + ".glb", this._scene);
        const meshes = asset.meshes;
        const animationGroups = asset.animationGroups;
        const skeletons = asset.skeletons;
        const skeleton = skeletons[0];
        const root = meshes[0];

        animationGroups.forEach((ag) => ag.stop());
        this.animationGroups = animationGroups;
        this.selectedAnimationGroups = animationGroups.filter((ag) => this.PICKED_ANIMS.includes(ag.name));

        // prepare skeletons and root anims
        this.PICKED_ANIMS.forEach((name) => {
            const skel = skeleton.clone("skeleton_" + name);
            this.skeletonForAnim.push(skel);
            const rootAnim = root.instantiateHierarchy(undefined, { doNotInstantiate: true }, (source, clone) => {
                clone.name = source.name;
            });
            if (rootAnim) {
                rootAnim.name = "_root_" + name;
                this.rootForAnim.push(rootAnim);
            }
        });

        // reset position & rotation
        // not sure why?
        root.position.setAll(0);
        root.scaling.setAll(1);
        root.rotationQuaternion = null;
        root.rotation.setAll(0);

        // calculate animations ranges
        const ranges = calculateRanges(this.selectedAnimationGroups);

        // merge mesh
        const merged = mergeMeshAndSkeleton(root, skeleton);

        // disable & hide root mesh
        root.setEnabled(false);

        // setup vat
        if (merged) {
            // save data
            this.playerMesh = merged;
            this.animationRanges = ranges;

            //
            merged.registerInstancedBuffer("bakedVertexAnimationSettingsInstanced", 4);
            merged.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);

            // bake VAT
            merged.bakedVertexAnimationManager = this.vatManager;
            merged.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);

            // bake vertex data
            //this.bakeToJson(merged, this.selectedAnimationGroups);

            // bake realtime
            const b = new VertexAnimationBaker(this._scene, merged);
            const bufferFromMesh = await bakeVertexData(merged, this.selectedAnimationGroups);
            const buffer = bufferFromMesh;
            this.vatManager.texture = b.textureFromBakedVertexData(buffer);

            /*
            // load prebaked vat animations

            const b = new VertexAnimationBaker(this._scene, merged);
            let req = await request("get", "./models/races/male_adventurer.json", {}, false, { headers: { "Content-Type": "application/json" } });
            let bufferFromMesh = b.loadBakedVertexDataFromJSON(JSON.parse(req.data));
            this.vatManager.texture = b.textureFromBakedVertexData(bufferFromMesh);*/

            //dispose resources
            /*
            meshes.forEach((m) => m.dispose(false, true));
            this.animationGroups.forEach((ag) => ag.dispose());
            skeletons.forEach((s) => s.dispose());*/
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
