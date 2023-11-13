// colyseus
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { GameController } from "./GameController";
import { bakeVertexData, calculateRanges } from "../Entities/Common/VatHelper";
import { BakedVertexAnimationManager } from "@babylonjs/core/BakedVertexAnimation/bakedVertexAnimationManager";
import { Vector4 } from "@babylonjs/core/Maths/math.vector";
import { VertexAnimationBaker } from "@babylonjs/core/BakedVertexAnimation/vertexAnimationBaker";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import AnimationHelper from "../Entities/Common/AnimationHelper";
import { mergeMeshAndSkeleton } from "../Entities/Common/MeshHelper";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Material, PBRMaterial } from "@babylonjs/core";
import { PBRCustomMaterial } from "@babylonjs/materials/custom/pbrCustomMaterial";

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

export class VatController {
    public _game: GameController;
    private _spawns = [];
    private _entityData = new Map();

    public get entityData() {
        return this._entityData;
    }

    constructor(game, spawns) {
        this._game = game;
        this._spawns = spawns;
    }

    async initialize() {
        await Promise.all(
            this._spawns.map(async (spawn: any) => {
                await this.prepareMesh(spawn.race);
            })
        );
        await this.retargetAnimations();
    }

    async check(race) {
        if (!this._entityData.has(race)) {
            await this.prepareMesh(race);
        }
    }

    // retarget animations for equipment
    async retargetAnimations() {
        this.entityData.forEach((entityData) => {
            let indexAnim = 0;
            for (const animationGroup of entityData.selectedAnimationGroups) {
                AnimationHelper.RetargetAnimationGroupToRoot(animationGroup, entityData.rootForAnim[indexAnim]);
                AnimationHelper.RetargetSkeletonToAnimationGroup(animationGroup, entityData.skeletonForAnim[indexAnim]);
                animationGroup.play(true);
                entityData.rootForAnim[indexAnim].setEnabled(false);
                indexAnim++;
            }
        });
    }

    async prepareMesh(key) {
        console.log("prepareMesh", key);
        let asset = this._game._loadedAssets["RACE_" + key];
        let race = this._game.getGameData("race", key);

        const meshes = asset.meshes;
        const animationGroups = asset.animationGroups;
        const skeletons = asset.skeletons;
        const skeleton = skeletons[0];
        const root = meshes[0] as Mesh;

        animationGroups.forEach((ag) => ag.stop());

        const selectedAnimationGroups = this.getAnimationGroups(animationGroups, race.animations);

        // prepare skeletons and root anims
        const rootForAnimations: any[] = [];
        const skeletonForAnim: any[] = [];
        for (let i in race.animations) {
            const skel = skeleton.clone("skeleton_" + key + "_" + i);
            skeletonForAnim.push(skel);
            const rootAnim = root.instantiateHierarchy(null, { doNotInstantiate: true }, (source, clone) => {
                clone.name = source.name;
            });
            if (rootAnim) {
                rootAnim.name = "_root_" + i;
                rootForAnimations.push(rootAnim);
            }
        }

        // reset position & rotation
        root.position.setAll(0);
        root.scaling.setAll(1);
        root.rotationQuaternion = null;
        root.rotation.setAll(0);

        // calculate animations ranges
        const ranges = calculateRanges(selectedAnimationGroups);

        // merge mesh
        const merged = mergeMeshAndSkeleton(root, skeleton);

        // setup vat
        if (merged) {
            // hide
            merged.isVisible = false;

            // create vat manager
            const vat = new BakedVertexAnimationManager(this._game.scene);

            // copy mesh for each material
            let materials = race.materials ?? [];
            let mergedMeshes: any[] = [];
            if (materials.length > 0) {
                let materialId = 0;
                race.materials.forEach((material) => {
                    let raceKey = race.key + "_" + materialId;

                    // prepare clone
                    let clone = merged.clone(raceKey);
                    clone.registerInstancedBuffer("bakedVertexAnimationSettingsInstanced", 4);
                    clone.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);
                    clone.bakedVertexAnimationManager = vat;
                    mergedMeshes.push(this.prepareClone(clone, material, raceKey, materialId));

                    materialId++;
                });
            } else {
                mergedMeshes.push(merged);
            }

            // save
            this._entityData.set(key, {
                mesh: mergedMeshes,
                animationRanges: ranges,
                selectedAnimationGroups: selectedAnimationGroups,
                rootForAnim: rootForAnimations,
                skeletonForAnim: skeletonForAnim,
                vat: vat,
            });

            // bake to file
            //await this.bakeTextureAnimation(key, merged);

            // bake realtime
            //await this.bakeTextureAnimationRealtime(key, merged);

            // load prebaked vat animations
            await this.loadBakedAnimation(key, merged);
        }
    }

    prepareClone(cloneMesh, material: any, raceKey, materialIndex) {
        const selectedMaterial = cloneMesh.material ?? false;

        if (selectedMaterial) {
            selectedMaterial.dispose();
        }

        // create a new material based on race and material index
        let alreadyExistMaterial = this._game.scene.getMaterialByName(raceKey);

        if (alreadyExistMaterial) {
            // material already exists
            cloneMesh.material = alreadyExistMaterial;
        } else {
            // create material as it does not exists
            let mat = new PBRCustomMaterial(raceKey);
            mat.albedoTexture = new Texture("./models/races/materials/" + material.material, this._game.scene, {
                invertY: false,
            });
            mat.reflectionColor = new Color3(0, 0, 0);
            mat.reflectivityColor = new Color3(0, 0, 0);

            //
            cloneMesh.material = mat;
        }

        return cloneMesh;
    }

    async bakeTextureAnimation(key: string, merged) {
        const b = new VertexAnimationBaker(this._game.scene, merged);
        const bufferFromMesh = await bakeVertexData(merged, this._entityData[key].selectedAnimationGroups);
        let vertexDataJson = b.serializeBakedVertexDataToJSON(bufferFromMesh);
        new JavascriptDataDownloader(vertexDataJson).download("text/json", key + ".json");
    }

    async bakeTextureAnimationRealtime(key: string, merged) {
        const b = new VertexAnimationBaker(this._game.scene, merged);
        const bufferFromMesh = await bakeVertexData(merged, this._entityData[key].selectedAnimationGroups);
        const buffer = bufferFromMesh;
        this._entityData[key].vat.texture = b.textureFromBakedVertexData(buffer);
    }

    async loadBakedAnimation(key: string, merged) {
        const b = new VertexAnimationBaker(this._game.scene, merged);
        const req = await fetch("./models/races/vat/" + key + ".json");
        const json = await req.json();
        let bufferFromMesh = await b.loadBakedVertexDataFromJSON(json);
        this._entityData.get(key).vat.texture = b.textureFromBakedVertexData(bufferFromMesh);
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

    process(delta) {
        const frameOffset = 0;
        this.entityData.forEach((entityData) => {
            entityData.vat.time += this._game.scene.getEngine().getDeltaTime() / 1000.0;
            const frame = entityData.vat.time * delta + frameOffset;

            // prepare skeleton (for weapon animations)
            entityData.skeletonForAnim.forEach((skel) => {
                skel.prepare();
            });

            // not sure what is the purpose of this block
            if (entityData.selectedAnimationGroups) {
                entityData.selectedAnimationGroups.forEach((animationGroup) => {
                    const frameRange = animationGroup.to - animationGroup.from;
                    animationGroup.goToFrame(animationGroup.from + (frame % Math.trunc(frameRange)));
                });
            }
        });
    }
}
