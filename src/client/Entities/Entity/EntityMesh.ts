import { Scene } from "@babylonjs/core/scene";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Vector3, Vector4 } from "@babylonjs/core/Maths/math";
import { Entity } from "../Entity";
import { Skeleton } from "@babylonjs/core/Bones/skeleton";
import { PlayerSlots } from "../../../shared/types";
import { GameController } from "../../Controllers/GameController";
import { EquipmentSchema } from "../../../server/rooms/schema";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { UserInterface } from "../../Controllers/UserInterface";
import { PBRCustomMaterial, SimpleMaterial } from "@babylonjs/materials";
import { randomNumberInRange } from "../../../shared/Utils";
import { mergeMesh } from "../Common/MeshHelper";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { setAnimationParameters } from "../Common/VatHelper";

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
    public equipments;

    constructor(entity: Entity) {
        this._entity = entity;
        this._scene = entity._scene;
        this._ui = entity._ui;
        this._game = entity._game;
        this._loadedAssets = entity._game._loadedAssets;
        this._room = entity._room;
        this._entityData = this._game._vatController.entityData.get(this._entity.race);

        this.equipments = new Map();
    }

    public async load() {
        // debug aggro mesh
        /*
        if (this._entity.type === "entity") {
            var material = this._scene.getMaterialByName("debug_entity_neutral");
            const sphere = MeshBuilder.CreateTorus(
                "debug_" + this._entity.race,
                { diameter: this._game.config.MONSTER_AGGRO_DISTANCE * 2, thickness: 0.1 },
                this._scene
            );
            sphere.isVisible = true;
            sphere.position = new Vector3(0, -1, 0);
            sphere.parent = box;
            sphere.material = material;
            this.debugMesh = sphere;
        }
        */
        // add selected image

        var material = this._scene.getMaterialByName("entity_selected");
        const selectedMesh = MeshBuilder.CreateCylinder("entity_selected_" + this._entity.race, { diameter: 2, height: 0.01, tessellation: 8 }, this._scene);
        selectedMesh.parent = this._entity;
        selectedMesh.material = material;
        selectedMesh.isVisible = false;
        selectedMesh.isPickable = false;
        selectedMesh.checkCollisions = false;
        selectedMesh.position = new Vector3(0, 0.1, 0);
        this.selectedMesh = selectedMesh;

        // load player mesh
        let materialIndex = this._entity.material ?? 0;
        const playerMesh = this._entityData.meshes[materialIndex].createInstance(this._entity.type + "" + this._entity.sessionId);
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

        // start action manager
        this.mesh.actionManager = new ActionManager(this._scene);

        // register hover over player
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (ev) => {
                let mesh = ev.meshUnderPointer;
                if (mesh) {
                    for (const childMesh of mesh.getChildMeshes()) {
                        childMesh.overlayColor = new Color3(1, 1, 1);
                        childMesh.overlayAlpha = 0.3;
                        childMesh.renderOverlay = true;
                    }
                }
                if (this.mesh.actionManager) {
                    this.mesh.actionManager.hoverCursor = this._ui._Cursor.get("hover");
                }
            })
        );

        // register hover out player
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, (ev) => {
                let mesh = ev.meshUnderPointer;
                if (mesh) {
                    for (const childMesh of mesh.getChildMeshes()) {
                        childMesh.renderOverlay = false;
                    }
                }
                if (this.mesh.actionManager) {
                    this.mesh.actionManager.hoverCursor = this._ui._Cursor.get();
                }
            })
        );

        setTimeout(() => {
            this.equipAllItems();
            // check for any equipment changes
            this._entity.entity.equipment.onAdd((e) => {
                this.equipItem(e);
            });
            this._entity.entity.equipment.onRemove((e) => {
                this.removeItem(e);
            });
            this._entity.animatorController.refreshItems();
        }, 1000);
    }

    public freezeMeshes() {
        // hide entity mesh
        this.mesh.setEnabled(false);
        this.mesh.freezeWorldMatrix();

        // hide equipment mesh
        if (this.equipments.length > 0) {
            this.equipments.forEach((equipment) => {
                equipment.setEnabled(false);
                equipment.freezeWorldMatrix();
            });
        }
    }

    public unfreezeMeshes() {
        // hide entity mesh
        this.mesh.unfreezeWorldMatrix();
        this.mesh.setEnabled(true);

        // hide equipment mesh
        if (this.equipments.length > 0) {
            this.equipments.forEach((equipment) => {
                equipment.unfreezeWorldMatrix();
                equipment.setEnabled(true);
            });
        }
    }

    public deleteMeshes() {
        // remove player mesh
        this.mesh.dispose();

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

    equipItem(e) {
        if (this.equipments.has(e.key)) return false;

        let item = this._game.getGameData("item", e.key);
        if (item && item.equippable) {
            let equipOptions = item.equippable;
            // if mesh needs to be added
            if (equipOptions.mesh) {
                // create instance of mesh
                let instance = this._entityData.items.get(item.key).createInstance("equip_" + this._entity.sessionId + "_" + e.key);
                instance.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);
                instance.isPickable = false;

                // or like this(so we don't need to sync it every frame)
                instance.setParent(this.mesh);
                instance.position.setAll(0);
                instance.rotationQuaternion = undefined;
                instance.rotation.setAll(0);

                // add
                this.equipments.set(e.key, instance);
            }
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
