import { Scene } from "@babylonjs/core/scene";
import { Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";

import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { InputText } from "@babylonjs/gui/2D/controls/inputText";
import { InputPassword } from "@babylonjs/gui/2D/controls/inputPassword";
import { Image } from "@babylonjs/gui/2D/controls/image";

import Config from "../../shared/Config";
import State from "./Screens";
import { request, apiUrl, generateRandomPlayerName } from "../../shared/Utils";
import alertMessage from "../../shared/Utils/alertMessage";
import { SceneController } from "../Controllers/Scene";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { CheckboxGroup, RadioGroup, SelectionPanel, SliderGroup } from "@babylonjs/gui/2D/controls/selector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { BakedVertexAnimationManager } from "@babylonjs/core/BakedVertexAnimation/bakedVertexAnimationManager";
import { VertexAnimationBaker } from "@babylonjs/core/BakedVertexAnimation/vertexAnimationBaker";
import { Engine } from "@babylonjs/core/Engines/engine";

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

    constructor() {
        this._newState = State.NULL;
    }

    public async createScene(app) {
        this._engine = app.engine;

        let scene = new Scene(app.engine);
        scene.clearColor = new Color4(0, 0, 0, 1);

        var camera = new ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 3, new Vector3(0, 0.5, 0), scene);
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

        //////////////////////////////////////////////////////////
        const PLANE_SIZE = 20;
        const INST_COUNT = 200;
        const PICKED_ANIMS = ["Hobbit_Attack", "Hobbit_Idle"];
        const URL_MESH = "player_hobbit.glb";
        const { meshes, animationGroups, skeletons } = await SceneLoader.ImportMeshAsync("", "./models/", URL_MESH, scene);


        console.log(animationGroups);
        const selectedAnimationGroups = animationGroups.filter((ag) => PICKED_ANIMS.includes(ag.name));
        const skeleton = skeletons[0];
        const root = meshes[0];

        root.position.setAll(0);
        root.scaling.setAll(1);
        root.rotationQuaternion = null;
        root.rotation.setAll(0);

        const merged = this.merge(root, skeleton);

        root.setEnabled(false);

        if (merged) {
            merged.visibility = 1;

            merged.registerInstancedBuffer("bakedVertexAnimationSettingsInstanced", 4);
            merged.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);

            const ranges = this.calculateRanges(selectedAnimationGroups);

            const setAnimationParameters = (vec, animIndex = Math.floor(Math.random() * selectedAnimationGroups.length)) => {
                const anim = ranges[animIndex];
                const from = Math.floor(anim.from);
                const to = Math.floor(anim.to);
                const ofst = Math.floor(Math.random() * (to - from - 1));
                vec.set(from, to - 1, ofst, 60); // skip one frame to avoid weird artifacts
            };

            const b = new VertexAnimationBaker(scene, merged);
            const manager = new BakedVertexAnimationManager(scene);
            merged.bakedVertexAnimationManager = manager;
            merged.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);
            setAnimationParameters(merged.instancedBuffers.bakedVertexAnimationSettingsInstanced, 0);

            const bufferFromMesh = await this.bakeVertexData(merged, selectedAnimationGroups)
            /*
            //let vertexDataJson = b.serializeBakedVertexDataToJSON(bufferFromMesh);
            //new JavascriptDataDownloader(vertexDataJson).download();

            // load prebaked vat animations
            // 2 mo for the baked animation, not sure if it is worth it for the moment to work on that

            let req = await request("get", "./models/male_baked_animation.json", {}, false, { headers: { "Content-Type": "application/json" } });
            let bufferFromMesh = b.loadBakedVertexDataFromJSON(JSON.parse(req.data));
            */
            const buffer = bufferFromMesh;

            manager.texture = b.textureFromBakedVertexData(buffer);

            const createInst = (id) => {
                const instance = merged.createInstance("instance_" + id);
                instance.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);
                setAnimationParameters(instance.instancedBuffers.bakedVertexAnimationSettingsInstanced);
                instance.position.x = Math.random() * PLANE_SIZE - PLANE_SIZE / 2;
                instance.position.z = Math.random() * PLANE_SIZE - PLANE_SIZE / 2;
                instance.rotation.y = 0;
                return instance;
            };

            for (let i = 0; i < INST_COUNT; i++) {
                createInst(i + "");
            }

            scene.registerBeforeRender(() => {
                manager.time += scene.getEngine().getDeltaTime() / 1000.0;
            });

            //dispose resources
            meshes.forEach((m) => m.dispose(false, true));
            animationGroups.forEach((ag) => ag.dispose());
            skeletons.forEach((s) => s.dispose());
        }
    }

    merge(mesh, skeleton) {
        // pick what you want to merge
        const allChildMeshes = mesh.getChildTransformNodes(true)[0].getChildMeshes(false);

        // Ignore Backpack because pf different attributes
        // https://forum.babylonjs.com/t/error-during-merging-meshes-from-imported-glb/23483
        const childMeshes = allChildMeshes.filter((m) => !m.name.includes("Backpack"));

        // multiMaterial = true
        const merged = Mesh.MergeMeshes(childMeshes, false, true, undefined, undefined, true);
        if (merged) {
            merged.name = "_MergedModel";
            merged.skeleton = skeleton;
        }
        return merged;
    }

    calculateRanges(animationGroups) {
        return animationGroups.reduce((acc, ag, index) => {
            if (index === 0) {
                acc.push({ from: Math.floor(ag.from), to: Math.floor(ag.to) });
            } else {
                const prev = acc[index - 1];
                acc.push({ from: prev.to + 1, to: prev.to + 1 + Math.floor(ag.to) });
            }
            return acc;
        }, []);
    }

    async bakeVertexData(mesh, ags) {
        const s = mesh.skeleton;
        const boneCount = s.bones.length;
        /** total number of frames in our animations */
        const frameCount = ags.reduce((acc, ag) => acc + (Math.floor(ag.to) - Math.floor(ag.from)) + 1, 0);

        // reset our loop data
        let textureIndex = 0;
        const textureSize = (boneCount + 1) * 4 * 4 * frameCount;
        const vertexData = new Float32Array(textureSize);

        function* captureFrame() {
            const skeletonMatrices = s.getTransformMatrices(mesh);
            vertexData.set(skeletonMatrices, textureIndex * skeletonMatrices.length);
        }

        let ii = 0;
        for (const ag of ags) {
            ag.reset();
            const from = Math.floor(ag.from);
            const to = Math.floor(ag.to);
            for (let frameIndex = from; frameIndex <= to; frameIndex++) {
                if (ii++ === 0) continue;
                // start anim for one frame
                ag.start(false, 1, frameIndex, frameIndex, false);
                // wait for finishing
                await ag.onAnimationEndObservable.runCoroutineAsync(captureFrame());
                textureIndex++;
                // stop anim
                ag.stop();
            }
        }

        return vertexData;
    }
}
