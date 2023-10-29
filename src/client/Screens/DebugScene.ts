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
import { AnimationGroup } from "@babylonjs/core";
import axios from "axios";
import { apiUrl } from "../Utils";
import { nanoid } from "nanoid";

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
    public SPAWN_INFO = [
        {
            key: "male_rogue",
            amount: 50,
            PICKED_ANIMS: ["Idle", "Walking_A"],
        },
        {
            key: "male_knight",
            amount: 50,
            PICKED_ANIMS: ["Idle", "Walking_A"],
        },
        {
            key: "male_mage",
            amount: 50,
            PICKED_ANIMS: ["Idle", "Walking_A"],
        },
    ];

    public models = [];
    public vatManagers: BakedVertexAnimationManager[] = [];
    public playerMesh;

    public animationRanges: any[] = [];
    public animationGroups: any[] = [];
    public selectedAnimationGroups: any[] = [];

    public skeletonForAnim: Skeleton[] = []; //
    public rootForAnim: TransformNode[] = []; //

    public mainSkeleton: Skeleton;

    public entityData: any[] = [];

    public entities = new Map();

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
        await this._game._assetsCtrl.load();
        console.log("loading complete", this._game._loadedAssets);

        // load weapon
        const weaponLoad = this._game._loadedAssets["ITEM_sword_01"];
        const weaponMesh = weaponLoad.meshes[0];
        this._game._loadedAssets["ITEM_sword_01"] = await mergeMesh(weaponMesh);

        // preload skeletons and animation
        await Promise.all(
            this.SPAWN_INFO.map(async (spawn) => {
                await this.prepareMesh(spawn);
            })
        );

        for (const spawn of this.SPAWN_INFO) {
            for (let i = 0; i < spawn.amount; i++) {
                this.createInst(spawn.key, i + "", 1);
            }
        }

        // render animations
        this._scene.registerBeforeRender(() => {
            for (const spawnInfo of this.SPAWN_INFO) {
                let entityData = this.entityData[spawnInfo.key];

                entityData.vat.time += this._scene.getEngine().getDeltaTime() / 1000.0;
                const frame = entityData.vat.time * 60 + frameOffset;

                // prepare skeleton
                entityData.skeletonForAnim.forEach((skel) => {
                    skel.prepare();
                });

                //
                if (entityData.selectedAnimationGroups) {
                    entityData.selectedAnimationGroups.forEach((animationGroup) => {
                        const frameRange = animationGroup.to - animationGroup.from;
                        animationGroup.goToFrame(animationGroup.from + (frame % Math.trunc(frameRange)));
                    });
                }
            }
        });

        // retarget animations
        for (const spawnInfo of this.SPAWN_INFO) {
            let entityData = this.entityData[spawnInfo.key];
            if (entityData.animationGroups) {
                for (const animationGroup of entityData.animationGroups) {
                    const indexAnim = spawnInfo.PICKED_ANIMS.indexOf(animationGroup.name);
                    if (indexAnim >= 1) {
                        AnimationHelper.RetargetAnimationGroupToRoot(animationGroup, entityData.rootForAnim[indexAnim]);
                        AnimationHelper.RetargetSkeletonToAnimationGroup(animationGroup, entityData.skeletonForAnim[indexAnim]);
                        animationGroup.play(true);
                    }
                }
            }
        }
    }

    ///
    createInst(key, id, animIndex) {
        let sessionId = nanoid();
        let entityData = this.entityData[key];

        const playerInstance = entityData.mesh.createInstance("player_" + id);
        playerInstance.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);
        setAnimationParameters(playerInstance.instancedBuffers.bakedVertexAnimationSettingsInstanced, animIndex, entityData.animationRanges);
        playerInstance.position.x = randomNumberInRange(-this.PLANE_SIZE, this.PLANE_SIZE);
        playerInstance.position.z = randomNumberInRange(-this.PLANE_SIZE, this.PLANE_SIZE);
        playerInstance.rotation.y = 0;
        this.createLabel(playerInstance, id);

        // attach weapon
        let weaponMeshMerged = this._game._loadedAssets["ITEM_sword_01"];
        let rand = Math.random();
        if (weaponMeshMerged && rand > 0.5) {
            const weapon = weaponMeshMerged.createInstance("player_" + id + "_sword");
            const skeletonAnim = entityData.skeletonForAnim[animIndex];
            let bone = skeletonAnim.bones[38];
            weapon.attachToBone(bone, playerInstance);
        }

        // save entity
        this.entities.set(sessionId, entityData);
    }

    getAnimationGroups(animationGroups, raceAnimations) {
        let anims: AnimationGroup[] = [];
        for (let i in raceAnimations) {
            let animationGroup = raceAnimations[i];
            if (animationGroups[animationGroup.animation_id]) {
                anims.push(animationGroups[animationGroup.animation_id]);
            }
        }
        return anims;
    }

    async prepareMesh(spawnInfo) {
        let asset = this._game._loadedAssets["RACE_" + spawnInfo.key];
        let race = this._game.getGameData("race", spawnInfo.key);
        let key = spawnInfo.key;

        const meshes = asset.meshes;
        const animationGroups = asset.animationGroups;
        const skeletons = asset.skeletons;
        const skeleton = skeletons[0];
        const root = meshes[0];

        animationGroups.forEach((ag) => ag.stop());

        //
        this.entityData[key] = {
            mesh: false,
            animationRanges: [],
            animationGroups: animationGroups,
            selectedAnimationGroups: this.getAnimationGroups(animationGroups, race.animations),
            rootForAnim: [],
            skeletonForAnim: [],
            vat: new BakedVertexAnimationManager(this._scene),
        };

        // prepare skeletons and root anims
        for (let i in race.animations) {
            const skel = skeleton.clone("skeleton_" + key + "_" + i);
            this.entityData[key].skeletonForAnim.push(skel);
            const rootAnim = root.instantiateHierarchy(undefined, { doNotInstantiate: true }, (source, clone) => {
                clone.name = source.name;
            });
            if (rootAnim) {
                rootAnim.name = "_root_" + i;
                this.entityData[key].rootForAnim.push(rootAnim);
            }
        }

        // reset position & rotation
        // not sure why?
        root.position.setAll(0);
        root.scaling.setAll(1);
        root.rotationQuaternion = null;
        root.rotation.setAll(0);

        // calculate animations ranges
        const ranges = calculateRanges(this.entityData[key].selectedAnimationGroups);

        // merge mesh
        const merged = mergeMeshAndSkeleton(root, skeleton);

        // disable & hide root mesh
        root.setEnabled(false);

        // setup vat
        if (merged) {
            // save data
            this.entityData[key].mesh = merged;
            this.entityData[key].animationRanges = ranges;

            //
            merged.registerInstancedBuffer("bakedVertexAnimationSettingsInstanced", 4);
            merged.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);
            merged.bakedVertexAnimationManager = this.entityData[key].vat;
            merged.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);

            // bake to file
            //await this.bakeTextureAnimation(key, merged);

            // bake realtime
            //await this.bakeTextureAnimationRealtime(key, merged);

            // load prebaked vat animations
            await this.loadBakedAnimation(key, merged);

            //merged.setEnabled(false);
        }
    }

    async bakeTextureAnimation(key: string, merged) {
        const b = new VertexAnimationBaker(this._scene, merged);
        const bufferFromMesh = await bakeVertexData(merged, this.entityData[key].selectedAnimationGroups);
        let vertexDataJson = b.serializeBakedVertexDataToJSON(bufferFromMesh);
        new JavascriptDataDownloader(vertexDataJson).download();
    }

    async bakeTextureAnimationRealtime(key: string, merged) {
        const b = new VertexAnimationBaker(this._scene, merged);
        const bufferFromMesh = await bakeVertexData(merged, this.entityData[key].selectedAnimationGroups);
        const buffer = bufferFromMesh;
        this.entityData[key].vat.texture = b.textureFromBakedVertexData(buffer);
    }

    async loadBakedAnimation(key: string, merged) {
        const b = new VertexAnimationBaker(this._scene, merged);
        const req = await fetch("./models/races/vat/" + key + ".json");
        const json = await req.json();
        let bufferFromMesh = await b.loadBakedVertexDataFromJSON(json);
        this.entityData[key].vat.texture = b.textureFromBakedVertexData(bufferFromMesh);
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
