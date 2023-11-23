// colyseus
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { GameController } from "./GameController";
import { bakeVertexData, calculateRanges, setAnimationParameters } from "../Entities/Common/VatHelper";
import { BakedVertexAnimationManager } from "@babylonjs/core/BakedVertexAnimation/bakedVertexAnimationManager";
import { Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";
import { VertexAnimationBaker } from "@babylonjs/core/BakedVertexAnimation/vertexAnimationBaker";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import AnimationHelper from "../Entities/Common/AnimationHelper";
import { mergeMesh, mergeMeshAndSkeleton } from "../Entities/Common/MeshHelper";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PBRCustomMaterial } from "@babylonjs/materials/custom/pbrCustomMaterial";
import { PlayerSlots } from "../../shared/types";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";

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
    private _skeletonData = new Map();

    public get entityData() {
        return this._entityData;
    }

    public get skeletonData() {
        return this._skeletonData;
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
    }

    async check(race) {
        if (!this._entityData.has(race)) {
            await this.prepareMesh(race);
        }
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

        // calculate animations ranges
        const ranges = calculateRanges(selectedAnimationGroups);

        //
        root.position.setAll(0);
        root.scaling.setAll(1);
        root.rotationQuaternion = null;
        root.rotation.setAll(0);

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

            // prepare items
            let items = this._game.loadGameData("items");
            let itemMeshes = new Map();
            for (let itemKey in items) {
                let item = items[itemKey];
                let slot = item.equippable ? PlayerSlots[item.equippable.slot] : 0;
                let boneId = race.bones[slot];

                if (slot && boneId) {
                    let rawMesh = this._game._loadedAssets["ITEM_" + item.key].meshes[0];
                    rawMesh.position.copyFrom(skeleton.bones[boneId].getAbsolutePosition()); // must be set in Blender
                    rawMesh.rotationQuaternion = undefined;
                    rawMesh.rotation.set(0, Math.PI * 1.5, 0); // we must set it in Blender
                    rawMesh.scaling.setAll(1);

                    /*
                    // if mesh offset required
                    if (item.scale) {
                        rawMesh.scaling = new Vector3(item.scale, item.scale, item.scale);
                    }
                    if (item.offset_x) {
                        rawMesh.position.x += item.offset_x;
                    }
                    if (item.offset_y) {
                        rawMesh.position.y += item.offset_y;
                    }
                    if (item.offset_z) {
                        rawMesh.position.z += item.offset_z;
                    }

                    // if rotationFix needed
                    if (item.rotation_x || item.rotation_y || item.rotation_z) {
                        // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
                        rawMesh.rotationQuaternion = null;
                        rawMesh.rotation.set(item.rotation_x ?? 0, item.rotation_y, item.rotation_z ?? 0);
                    }*/

                    let itemMesh = mergeMesh(rawMesh);

                    if (itemMesh) {
                        /*
                        // if mesh offset required
                        if (item.scale) {
                            itemMesh.scaling = new Vector3(item.scale, item.scale, item.scale);
                        }
                        if (item.offset_x) {
                            itemMesh.position.x += item.offset_x;
                        }
                        if (item.offset_y) {
                            itemMesh.position.y += item.offset_y;
                        }
                        if (item.offset_z) {
                            itemMesh.position.z += item.offset_z;
                        }

                        // if rotationFix needed
                        if (item.rotation_x || item.rotation_y || item.rotation_z) {
                            // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
                            itemMesh.rotationQuaternion = null;
                            itemMesh.rotation.set(item.rotation_x ?? 0, 0, item.rotation_z ?? 0);
                        }*/

                        // weapon VAT
                        itemMesh.skeleton = skeleton;
                        itemMesh.bakedVertexAnimationManager = vat;
                        itemMesh.registerInstancedBuffer("bakedVertexAnimationSettingsInstanced", 4);
                        itemMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);

                        // manually set MatricesIndicesKind & MatricesWeightsKind
                        // https://doc.babylonjs.com/features/featuresDeepDive/mesh/bonesSkeletons#preparing-mesh
                        const totalCount = itemMesh.getTotalVertices();
                        const weaponMI: any = [];
                        const weaponMW: any = [];
                        for (let i = 0; i < totalCount; i++) {
                            weaponMI.push(boneId, 0, 0, 0);
                            weaponMW.push(1, 0, 0, 0);
                        }

                        itemMesh.setVerticesData(VertexBuffer.MatricesIndicesKind, weaponMI, false);
                        itemMesh.setVerticesData(VertexBuffer.MatricesWeightsKind, weaponMW, false);

                        //
                        //itemMesh.setEnabled(false);

                        //
                        itemMeshes.set(itemKey, itemMesh);
                    }
                }
            }

            // save
            this._entityData.set(key, {
                mesh: mergedMeshes,
                animationRanges: ranges,
                selectedAnimationGroups: selectedAnimationGroups,
                skeleton: skeleton,
                vat: vat,
                items: itemMeshes,
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
        this.entityData.forEach((entityData) => {
            entityData.vat.time += this._game.scene.getEngine().getDeltaTime() / 1000.0;
        });
    }
}
