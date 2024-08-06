import { Scene } from "@babylonjs/core/scene";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3, Vector4 } from "@babylonjs/core/Maths/math";
import { Entity } from "../Entity";
import { Skeleton } from "@babylonjs/core/Bones/skeleton";
import { GameController } from "../../Controllers/GameController";
import { EquipmentSchema } from "../../../server/rooms/schema";
import { UserInterface } from "../../Controllers/UserInterface";
import { VatController } from "../../Controllers/VatController";
import { EquippableType } from "../../../shared/types";

export class EntityMesh {
    private _entity: Entity;
    private _scene: Scene;
    private _ui: UserInterface;
    private _loadedAssets;
    private _room;
    private _game: GameController;
    private _entityData;
    private _animationGroups: AnimationGroup[];
    public skeleton: Skeleton;
    public mesh: Mesh;
    public playerMesh;
    public debugMesh: Mesh;
    public selectedMesh: Mesh;
    public fakeShadow: Mesh;
    public equipments;

    constructor(entity: Entity) {
        this._entity = entity;
        this._scene = entity._scene;
        this._ui = entity._ui;
        this._game = entity._game;
        this._loadedAssets = entity._game._loadedAssets;
        this._room = entity._room;
        this._entityData = entity.entityData;

        this.equipments = new Map();
    }

    public createMesh() {
        // load player mesh

        let materialIndex = VatController.findMeshKey(this._entity.raceData, this._entity);

        if (this._entityData.meshes.has(materialIndex)) {
            const playerMesh = this._entityData.meshes.get(materialIndex).createInstance(this._entity.type + "" + this._entity.sessionId);
            playerMesh.parent = this._entity;
            playerMesh.isPickable = true;
            playerMesh.rotationQuaternion = null; // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
            if (this._entity.rotationFix) {
                playerMesh.rotation.set(0, this._entity.rotationFix, 0);
            }
            playerMesh.scaling.set(this._entity.scale, this._entity.scale, this._entity.scale);
            playerMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);

            this.mesh = playerMesh;

            // set metadata
            this.mesh.metadata = {
                sessionId: this._entity.sessionId,
                type: this._entity.type,
                race: this._entity.race,
                name: this._entity.name,
            };

            this.equipments.forEach((equipment) => {
                equipment.setParent(this.mesh);
            });
        } else {
            console.error("ENTITY MESH, COULD NOT FIND MESH AT", materialIndex);
        }
    }

    public async load() {
        // create entity mesh
        this.createMesh();

        // selected circle
        var material = this._scene.getMaterialByName("entity_selected");
        const selectedMesh = MeshBuilder.CreateCylinder("entity_selected_" + this._entity.race, { diameter: 2, height: 0.01, tessellation: 8 }, this._scene);
        selectedMesh.parent = this._entity;
        selectedMesh.material = material;
        selectedMesh.isVisible = false;
        selectedMesh.isPickable = false;
        selectedMesh.checkCollisions = false;
        selectedMesh.position = new Vector3(0, 0.05, 0);
        this.selectedMesh = selectedMesh;

        // add cheap shadow
        if (this._loadedAssets["DYNAMIC_shadow_01"]) {
            let shadowMesh = this._loadedAssets["DYNAMIC_shadow_01"].createInstance("shadow_" + this._entity.sessionId);
            shadowMesh.parent = this._entity;
            shadowMesh.isPickable = false;
            shadowMesh.checkCollisions = false;
            shadowMesh.doNotSyncBoundingInfo = true;
            shadowMesh.position = new Vector3(0, 0.04, 0);
            this.fakeShadow = shadowMesh;
        }

        setTimeout(() => {
            // check for any equipment changes
            this._entity.entity.equipment.onAdd((e) => {
                this.equipItem(e);
            });
            this._entity.entity.equipment.onRemove((e) => {
                this.removeItem(e);
            });
        }, 300);

        return true;
    }

    public deleteMeshes() {
        // remove player mesh
        this.mesh.dispose();
        this.fakeShadow.dispose();

        // remove any other mesh
        if (this.equipments.length > 0) {
            this.equipments.forEach((equipment) => {
                equipment.dispose();
            });
        }
    }

    ////////////////////////////////////////////////////
    ///////////// EQUIPMENT ////////////////////
    ////////////////////////////////////////////////////

    removeItem(e) {
        if (this.equipments.has(e.key)) {
            this.equipments.get(e.key).dispose();
            this.equipments.delete(e.key);
        }
    }

    async equipItem(e) {
        // if not already equipped
        if (this.equipments.has(e.key)) return false;

        // get item data
        let item = this._game.getGameData("item", e.key);
        if (item && item.equippable) {
            // if mesh needs to be added
            let equipOptions = item.equippable;

            // if dynamic item
            if (equipOptions && equipOptions.type === EquippableType.DYNAMIC) {
                this._game._vatController.prepareItemForVat(this._entityData, e.key);
            }
            if (equipOptions && equipOptions.type === EquippableType.EMBEDDED) {
                this._game._vatController.prepareEmbeddedItemForVat(this._entityData, e.key);
            }
            if (equipOptions && equipOptions.type === EquippableType.NOT_VISIBLE) {
                return false;
            }

            // create instance of mesh
            let mesh = this._entityData.items.get(item.key);

            if (!mesh) {
                console.error("Cannot find mesh to create item instance", item.key);
                return false;
            }

            let instance = mesh.createInstance("equip_" + this._entity.sessionId + "_" + e.key);
            instance.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);
            instance.isPickable = false;

            // or like this(so we don't need to sync it every frame)
            instance.setParent(this.mesh);
            instance.position.setAll(0);
            instance.rotationQuaternion = undefined;
            instance.rotation.setAll(0);

            // add
            this.equipments.set(e.key, instance);

            //
            e.mesh = instance;

            // refresh animation
            this._entity.animatorController.refreshAnimation();
        }
    }

    public equipAllItems() {
        // equip all items
        this._entity.equipment.forEach((e: EquipmentSchema) => {
            this.equipItem(e);
        });
    }

    public getAnimation() {
        return this._animationGroups;
    }
}
