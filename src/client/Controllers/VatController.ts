// colyseus
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { GameController } from "./GameController";
import { bakeVertexData, calculateRanges } from "../Entities/Common/VatHelper";
import { BakedVertexAnimationManager } from "@babylonjs/core/BakedVertexAnimation/bakedVertexAnimationManager";
import { Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";
import { VertexAnimationBaker } from "@babylonjs/core/BakedVertexAnimation/vertexAnimationBaker";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { mergeMesh, mergeMeshAndSkeleton } from "../Entities/Common/MeshHelper";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { EntityState, EquippableType, Item, PlayerSlots } from "../../shared/types";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { Entity } from "../Entities/Entity";
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
    private _spawns: any[] = [];
    public _entityData = new Map();
    public _vatData = new Map();
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
        // always load humanoid
        await this.prepareVat(this._game.getGameData("race", "humanoid"));

        // load all others
        for (let spawn of this._spawns) {
            let race = this._game.getGameData("race", spawn.race);
            if (!this._entityData.has(race.vat)) {
                await this.prepareVat(race);
            }
        }
    }

    async fetchVAT(key) {
        const url = "./models/races/vat/" + key + ".json";
        console.log(url);
        const response = await fetch(url);
        const movies = await response.json();
        return movies;
    }

    async prepareVat(race) {
        let key = race.vat.key;

        if (!this._entityData.has(key)) {
            //console.log("[prepareVat] 2 " + key, race);

            // get vat data
            const bakedAnimationJson = await this.fetchVAT(key);

            const { animationGroups, skeletons } = this._game._loadedAssets["VAT_" + key];
            const skeleton = skeletons[0];

            // get selected animations
            animationGroups.forEach((ag) => ag.stop());
            const selectedAnimationGroups = this.getAnimationGroups(animationGroups, race.vat.animations);

            // calculate animations ranges
            const ranges = calculateRanges(selectedAnimationGroups);

            // create vat manager
            const b = new VertexAnimationBaker(this._game.scene, skeleton);
            const manager = new BakedVertexAnimationManager(this._game.scene);

            // load prebaked vat animations
            let bufferFromMesh = b.loadBakedVertexDataFromJSON(bakedAnimationJson);
            manager.texture = b.textureFromBakedVertexData(bufferFromMesh);

            // save vat
            this._entityData.set(key, {
                name: key,
                meshes: new Map(),
                animationRanges: ranges,
                selectedAnimationGroups: selectedAnimationGroups,
                vat: manager,
                skeleton: skeleton,
                items: new Map(),
                bones: race.vat.bones,
                animations: race.vat.animations,
            });
        }
        return this._entityData.get(key);
    }

    /**
     * This function remove any unwanted meshes, apply the right materials and more
     *
     * @param baseMeshes
     * @param data
     * @returns
     */
    makeHumanoid(rawMesh, data) {
        let keepArray = [
            data.head, //
            "Base_ArmLeft",
            "Base_ArmRight",
            "Base_Body",
            "Base_LegLeft",
            "Base_LegRight",
            "Armor_Cape",
        ];

        rawMesh.getChildMeshes(false).forEach((element) => {
            var n = element.id.lastIndexOf(".");
            var result = element.id.substring(n + 1);
            if (!keepArray.includes(result)) {
                element.dispose();
                //console.error("DISPOSING", element.id);
            } else {
                //element.removeVerticesData(VertexBuffer.MatricesIndicesKind)
                //element.removeVerticesData(VertexBuffer.MatricesWeightsKind)
                //console.log(element.getVerticesDataKinds());
                //console.log("KEEPING", element.id);
            }
        });

        return rawMesh;
    }

    // this should regenerate entity mesh with any head/equipemnt/material needed
    async refreshMesh(entity: Entity) {
        console.log("[VAT] refresh mesh", entity);

        // reset parent of any dynamic items
        if (entity.meshController.equipments.size > 0) {
            entity.meshController.equipments.forEach((equipment) => {
                equipment.setParent(entity);
            });
        }

        // remove existing mesh
        let mesh = entity.entityData.meshes.get(entity.sessionId);
        if (mesh) {
            mesh.dispose();
            entity.entityData.meshes.delete(entity.sessionId);
        }

        // create new mesh based on the new data
        this.prepareMesh(entity);

        // wait a bit before adding the new mesh to the entity
        setTimeout(() => {
            entity.meshController.createMesh();
            entity.animatorController.mesh = entity.meshController.mesh;
            entity.animatorController.refreshAnimation();
        }, 200);
    }

    async prepareMesh(entity) {
        let key = entity.race;
        let race = this._game.getGameData("race", key);
        let meshId = VatController.findMeshKey(race, entity);

        if (!race) {
            console.log("Race does not exists", key);
        }

        // gets or prepare vat
        let vat = await this.prepareVat(race);

        // gets mesh if already prepared
        if (vat.meshes.has(meshId)) {
            return false;
        }

        // clone raw mesh
        let rawMesh = this._game._loadedAssets["RACE_" + key].meshes[0].clone("TEST");
        rawMesh.name = "_root_race_" + key;

        // reset positions
        rawMesh.position.setAll(0);
        rawMesh.scaling.setAll(1);
        rawMesh.rotationQuaternion = null;
        rawMesh.rotation.setAll(0);

        // if customizable
        // todo: more work here to make it better
        if (race.customizable) {
            rawMesh = this.makeHumanoid(rawMesh, entity);
        }

        // merge mesh with skeleton
        let modelMeshMerged = mergeMeshAndSkeleton(rawMesh, vat.skeleton);

        // setup vat
        if (modelMeshMerged) {
            // update material
            this.prepareMaterial(modelMeshMerged, race.key, entity.material);

            // set mesh
            modelMeshMerged.registerInstancedBuffer("bakedVertexAnimationSettingsInstanced", 4);
            modelMeshMerged.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);
            modelMeshMerged.bakedVertexAnimationManager = vat.vat;

            // save for later use
            vat.meshes.set(meshId, modelMeshMerged);

            // hide mesh
            modelMeshMerged.setEnabled(false);
            rawMesh.dispose();
        }
    }

    static findMeshKey(race, entity) {
        let meshId = race.key;
        if (race.customizable) {
            meshId = entity.head + "_" + entity.material;
            //meshId = entity.sessionId;
        }
        return meshId;
    }

    async prepareItemForVat(entityData, itemKey) {
        // if already prepared, stop
        if (entityData.items.has(itemKey)) {
            return false;
        }

        // load item
        let item = this._game.getGameData("item", itemKey);
        let slot = item.equippable ? PlayerSlots[item.equippable.slot] : 0;
        let boneId = entityData.bones[slot]; // bones come from entityData

        if (!boneId) return false;

        // clone raw mesh
        let rawMesh = this._game._loadedAssets["ITEM_" + item.key].meshes[0].clone("TEST");
        rawMesh.name = "_root_item_" + itemKey;
        rawMesh.position.copyFrom(entityData.skeleton.bones[boneId].getAbsolutePosition());
        rawMesh.rotationQuaternion = undefined;
        rawMesh.rotation.set(0, Math.PI * 1.5, 0);
        rawMesh.scaling.setAll(1);

        // if mesh offset required
        let equipOptions = item.equippable;
        if (equipOptions.scale) {
            rawMesh.scaling = new Vector3(equipOptions.scale, equipOptions.scale, equipOptions.scale);
        }
        if (equipOptions.offset_x) {
            rawMesh.position.x += equipOptions.offset_x;
        }
        if (equipOptions.offset_y) {
            rawMesh.position.y += equipOptions.offset_y;
        }
        if (equipOptions.offset_z) {
            rawMesh.position.z += equipOptions.offset_z;
        }

        // if rotationFix needed
        if (equipOptions.rotation_x || equipOptions.rotation_y || equipOptions.rotation_z) {
            // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
            rawMesh.rotationQuaternion = null;
            rawMesh.rotation.set(equipOptions.rotation_x ?? 0, equipOptions.rotation_y ?? 0, equipOptions.rotation_z ?? 0);
        }

        // merge mesh
        let itemMesh = mergeMesh(rawMesh, itemKey);
        if (itemMesh) {
            itemMesh.name = entityData.name + "_" + itemMesh.name;

            // update material
            if (item.material) {
                VatController.loadItemMaterial(this._game.scene, itemMesh, item.material);
            }

            // attach to VAT
            itemMesh.skeleton = entityData.skeleton;
            itemMesh.bakedVertexAnimationManager = entityData.vat;
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

            // cleanup
            rawMesh.dispose();
            itemMesh.setEnabled(false);

            // save for later use
            entityData.items.set(itemKey, itemMesh);
        }
    }

    async prepareEmbeddedItemForVat(entityData, itemKey) {
        // if already prepared, stop
        if (entityData.items.has(itemKey)) {
            return false;
        }

        // clone raw mesh
        let key = entityData.name;
        let item = this._game.getGameData("item", itemKey);
        let rawMesh = this._game._loadedAssets["RACE_" + key].meshes[0].clone("embedded_vat_" + itemKey) as Mesh;

        // find raw mesh
        //console.log(rawMesh.id, rawMesh.getChildMeshes());
        rawMesh.getChildMeshes(false).forEach((element) => {
            var n = element.id.lastIndexOf(".");
            var result = element.id.substring(n + 1);
            if (!item.equippable.mesh.includes(result)) {
                element.dispose();
            } else {
                //console.log("FOUND MESH", element.id);
            }
        });

        let itemMesh = mergeMesh(rawMesh, itemKey);

        if (itemMesh) {
            // update material
            if (item.material) {
                VatController.loadItemMaterial(this._game.scene, itemMesh, item.material);
            }

            // attach to VAT
            itemMesh.skeleton = entityData.skeleton;
            itemMesh.registerInstancedBuffer("bakedVertexAnimationSettingsInstanced", 4);
            itemMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);
            itemMesh.bakedVertexAnimationManager = entityData.vat;
            entityData.items.set(itemKey, itemMesh);

            itemMesh.setEnabled(false);
            rawMesh.dispose();
        }
    }

    prepareMaterial(cloneMesh, raceKey, materialIndex) {
        // get race
        let race = this._game.getGameData("race", raceKey);

        // remove any existing material
        const selectedMaterial = cloneMesh.material ?? false;
        if (selectedMaterial) {
            selectedMaterial.dispose();
        }

        let materialKey = race.materials[materialIndex].material;
        let alreadyExistMaterial = this._game.scene.getMaterialByName(materialKey);
        if (alreadyExistMaterial) {
            cloneMesh.material = alreadyExistMaterial;
        } else {
            // create material as it does not exists
            let mat = new PBRCustomMaterial(materialKey);
            mat.albedoTexture = new Texture("./models/materials/" + materialKey, this._game.scene, {
                invertY: false,
            });
            mat.reflectionColor = new Color3(0, 0, 0);
            mat.reflectivityColor = new Color3(0, 0, 0);
            mat.backFaceCulling = false;
            mat.freeze();

            // assign to mesh
            cloneMesh.material = mat;
        }
    }

    static loadItemMaterial(scene, cloneMesh, materialName) {
        // remove any existing material
        const existing = cloneMesh.material ?? false;
        if (existing) {
            existing.dispose();
        }

        //
        let alreadyExistMaterial = scene.getMaterialByName(materialName);
        if (alreadyExistMaterial) {
            cloneMesh.material = alreadyExistMaterial;
        } else {
            // create material as it does not exists
            let mat = new PBRCustomMaterial(materialName + "_custom");
            mat.albedoTexture = new Texture("./models/materials/" + materialName, scene, {
                invertY: false,
            });
            mat.reflectionColor = new Color3(0, 0, 0);
            mat.reflectivityColor = new Color3(0, 0, 0);
            mat.backFaceCulling = false;
            mat.freeze();

            // assign to mesh
            cloneMesh.material = mat;
        }
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

    // todo: there must a better way to do this, it's so ugly
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

    process(delta) {
        this._entityData.forEach((entityData) => {
            entityData.vat.time += this._game.scene.getEngine().getDeltaTime() / 1000.0;
        });
    }
}
