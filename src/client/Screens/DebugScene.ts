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

import { calculateRanges, bakeVertexData, setAnimationParameters } from "../Entities/Common/VatHelper";
import AnimationHelper from "../Entities/Common/AnimationHelper";
import { GameController } from "../Controllers/GameController";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { nanoid } from "nanoid";
import { mergeMesh, mergeMeshAndSkeleton } from "../Entities/Common/MeshHelper";
import { PBRCustomMaterial } from "@babylonjs/materials/custom/pbrCustomMaterial";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

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

const frameOffset = 0;
const PLANE_SIZE = 10;

class Entity {
    public game;
    public ui;
    public mesh;
    public entityData;
    public spawnInfo;
    public currentAnimationRange = 0;
    public currentAnimationIndex = 0;

    public equipment: InstancedMesh[] = [];

    constructor(playerInstance, entityData, app, spawnInfo) {
        this.mesh = playerInstance;
        this.entityData = entityData;
        this.ui = app._ui;
        this.game = app._game;
        this.spawnInfo = spawnInfo;

        this.mesh.position.x = randomNumberInRange(-PLANE_SIZE, PLANE_SIZE);
        this.mesh.position.z = randomNumberInRange(-PLANE_SIZE, PLANE_SIZE);
        this.mesh.rotation.y = 0;
        this.createLabel(this.mesh, spawnInfo.name);

        // attach weapon
        /*
        let weaponMeshMerged = this.game._loadedAssets["ITEM_sword_01"];
        const weapon = weaponMeshMerged.createInstance("player_sword") as InstancedMesh;
        const skeletonAnim = entityData.skeletonForAnim[0];
        let bone = skeletonAnim.bones[12];
        weapon.attachToBone(bone, playerInstance);
        this.equipment.push(weapon);*/

        // default animation
        this.mesh.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);
    }

    update() {
        // every update, there is a chance the aniamtion changes
        let chance = Math.random();
        if (this.currentAnimationRange <= 0 && chance > 0.5) {
            let newAnimationIndex = Math.floor(Math.random() * this.entityData.selectedAnimationGroups.length);
            let animationRange = this.entityData.animationRanges[newAnimationIndex];
            this.currentAnimationRange = animationRange.to - animationRange.from;
            this.setAnimationParameters(this.mesh.instancedBuffers.bakedVertexAnimationSettingsInstanced, newAnimationIndex, this.entityData.animationRanges);
            this.reattachEquipement(newAnimationIndex);
        }
        this.currentAnimationRange--;
    }

    reattachEquipement(newAnimationIndex) {
        this.equipment.forEach((item) => {
            item.detachFromBone();
            const skeletonAnim = this.entityData.skeletonForAnim[newAnimationIndex];
            let bone = skeletonAnim.bones[12];
            item.attachToBone(bone, this.mesh);
        });
    }

    setAnimationParameters = function (vec, animIndex, ranges) {
        animIndex = animIndex ?? 0;
        const anim = ranges[animIndex];
        const from = Math.floor(anim.from);
        const to = Math.floor(anim.to);
        const ofst = 0;
        vec.set(from, to - 1, ofst, 60); // skip one frame to avoid weird artifacts
        return animIndex;
    };

    createLabel(mesh, name = "Name") {
        var label = new TextBlock("player_chat_label");
        label.text = name;
        label.color = "white";
        label.paddingLeft = "5px;";
        label.paddingTop = "5px";
        label.paddingBottom = "5px";
        label.paddingRight = "5px";
        label.textWrapping = TextWrapping.WordWrap;
        label.resizeToFit = true;
        this.ui.addControl(label);
        label.linkWithMesh(mesh);
        label.linkOffsetY = -130;
    }
}

export class DebugScene {
    public _engine: Engine;
    public _scene: Scene;
    public _game: GameController;
    public _newState: State;
    public _button: Button;
    public _ui;
    public stackPanel;

    public results;
    public SPAWN_INFO = [];

    public entityData = new Map();
    public entities = new Map();

    constructor() {
        this._newState = State.NULL;
    }

    public async createScene(app) {
        this._engine = app.engine;
        this._game = app;

        let scene = new Scene(app.engine);
        scene.clearColor = new Color4(0, 0, 0, 1);

        // add camera
        var camera = new ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 3, new Vector3(0, 3, 3), scene);
        camera.attachControl(app.canvas, true);
        camera.lowerRadiusLimit = 2;
        camera.upperRadiusLimit = 20;
        camera.wheelDeltaPercentage = 0.01;

        // add light
        var light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
        light.intensity = 0.6;
        light.specular = Color3.Black();

        // add ground
        const ground = MeshBuilder.CreateGround("ground", { width: PLANE_SIZE, height: PLANE_SIZE }, scene);

        // load scene
        this._scene = scene;

        // add ui
        this._ui = AdvancedDynamicTexture.CreateFullscreenUI("UI_Names", true, this._scene);

        // add FPS
        var label = new TextBlock("FPS");
        label.text = "FPS: " + this._engine.getFps();
        label.color = "white";
        label.top = "15px;";
        label.left = "-15px;";
        label.textWrapping = TextWrapping.WordWrap;
        label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        label.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._ui.addControl(label);

        // preload assets
        this._game.initializeAssetController();
        await this._game._assetsCtrl.load();

        // UI
        const leftStackPanel = new StackPanel("leftStackPanel");
        leftStackPanel.topInPixels = 15;
        leftStackPanel.leftInPixels = 15;
        leftStackPanel.width = 0.2;
        leftStackPanel.height = 0.6;
        leftStackPanel.background = "transparent";
        leftStackPanel.spacing = 5;
        leftStackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        leftStackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        leftStackPanel.adaptHeightToChildren = true;
        leftStackPanel.setPaddingInPixels(5, 5, 5, 5);
        leftStackPanel.isVertical = true;
        this._ui.addControl(leftStackPanel);
        this.stackPanel = leftStackPanel;

        const btnTitle = Button.CreateSimpleButton("btnChoice", "Generate VAT");
        btnTitle.top = "0px";
        btnTitle.width = 1;
        btnTitle.height = "30px";
        btnTitle.color = "white";
        btnTitle.background = "transparent";
        btnTitle.thickness = 0;
        btnTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        btnTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        leftStackPanel.addControl(btnTitle);

        let races = this._game.loadGameData("races");
        for (let id in races) {
            let element = races[id];

            this.SPAWN_INFO.push(element);

            const btnChoice = Button.CreateSimpleButton("btnChoice_" + element.key, element.key);
            btnChoice.top = "0px";
            btnChoice.width = 1;
            btnChoice.height = "30px";
            btnChoice.color = "white";
            btnChoice.background = "gray";
            btnChoice.thickness = 1;
            btnChoice.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            btnChoice.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            leftStackPanel.addControl(btnChoice);

            btnChoice.onPointerDownObservable.add(() => {
                this.stackPanel.isVisible = false;
                let entityData = this.entityData.get(element.key);
                this.bakeTextureAnimation(element.key, entityData.mesh);

                this.spawn(entityData);
            });
        }

        // preload skeletons and animation
        await Promise.all(
            this.SPAWN_INFO.map(async (spawn) => {
                await this.prepareMesh(spawn);
            })
        );
        console.log("[VAT] Loaded", this.entityData);

        this._scene.registerBeforeRender(() => {
            label.text = "FPS: " + this._engine.getFps();
        });
    }

    spawn(entityData) {
        for (let i = 0; i < 100; i++) {
            let sessionId = nanoid();
            const playerInstance = entityData.mesh.createInstance("player_" + i);
            this.entities.set(sessionId, new Entity(playerInstance, entityData, this, {}));
        }
    }

    async prepareMesh(spawnInfo) {
        let asset = this._game._loadedAssets["RACE_" + spawnInfo.key];
        let race = this._game.getGameData("race", spawnInfo.key);
        let key = spawnInfo.key;

        const animationGroups = asset.animationGroups;
        const skeletons = asset.skeletons;
        const skeleton = skeletons[0];

        animationGroups.forEach((ag) => ag.stop());

        const selectedAnimationGroups = this.getAnimationGroups(animationGroups, race.vat.animations);

        // reset position & rotation
        let rawMesh = this._game._loadedAssets["RACE_" + key].meshes[0].clone("TEST");
        rawMesh.position.setAll(0);
        rawMesh.scaling.setAll(1);
        rawMesh.rotationQuaternion = null;
        rawMesh.rotation.setAll(0);

        // add material
        this.prepareMaterial(rawMesh, spawnInfo.key, 0);

        // calculate animations ranges
        const ranges = calculateRanges(selectedAnimationGroups);

        // merge mesh
        const merged = mergeMeshAndSkeleton(rawMesh, skeleton, race.key + "_merged");

        // setup vat
        if (merged) {
            // create vat manager
            const vat = new BakedVertexAnimationManager(this._scene);

            //
            merged.registerInstancedBuffer("bakedVertexAnimationSettingsInstanced", 4);
            merged.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);
            merged.bakedVertexAnimationManager = vat;

            // save
            this.entityData.set(key, {
                mesh: merged,
                animationRanges: ranges,
                animationGroups: animationGroups,
                selectedAnimationGroups: selectedAnimationGroups,
                vat: vat,
            });

            rawMesh.dispose();
            merged.isEnabled(true);

            // bake to file
            //await this.bakeTextureAnimation(key, merged);

            // bake realtime
            //await this.bakeTextureAnimationRealtime(key, merged);

            // load prebaked vat animations
            //await this.loadBakedAnimation(key, merged);
        }
    }

    async bakeTextureAnimation(key: string, merged) {
        const b = new VertexAnimationBaker(this._scene, merged);
        const bufferFromMesh = await bakeVertexData(merged, this.entityData.get(key).selectedAnimationGroups);
        let vertexDataJson = b.serializeBakedVertexDataToJSON(bufferFromMesh);
        new JavascriptDataDownloader(vertexDataJson).download("text/json", key + ".json");
        this.stackPanel.isVisible = true;
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
        this.entityData.get(key).vat.texture = b.textureFromBakedVertexData(bufferFromMesh);
    }

    //
    prepareMaterial(cloneMesh, raceKey, materialIndex) {
        // get race
        let race = this._game.getGameData("race", raceKey);

        // remove any existing material
        const selectedMaterial = cloneMesh.material ?? false;
        if (selectedMaterial) {
            selectedMaterial.dispose();
        }

        let materialKey = race.materials[materialIndex].material;
        let mat = this._game.scene.getMaterialByName(materialKey);
        if (mat) {
            cloneMesh.material = mat;
        } else {
            // create material as it does not exists
            mat = new PBRCustomMaterial(materialKey);
            mat.albedoTexture = new Texture("./models/materials/" + materialKey, this._game.scene, {
                invertY: false,
            });
            mat.reflectionColor = new Color3(0, 0, 0);
            mat.reflectivityColor = new Color3(0, 0, 0);
            mat.backFaceCulling = false;

            // assign to mesh
            cloneMesh.material = mat;
        }

        console.log(mat);
    }

    getAnimationGroups(animationGroups, raceAnimations) {
        let anims: AnimationGroup[] = [];
        for (let i in raceAnimations) {
            let animationGroup = raceAnimations[i];
            let anim = animationGroups.filter((ag) => animationGroup.name === ag.name);
            if (anim && anim[0]) {
                anims.push(anim[0]);
            }
        }
        return anims;
    }
}
