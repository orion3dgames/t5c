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
    public isCurrentPlayer: boolean;
    public debugMesh: Mesh;
    public selectedMesh: Mesh;
    public equipments: Mesh[] = [];

    constructor(entity: Entity) {
        this._entity = entity;
        this._scene = entity._scene;
        this._ui = entity.ui;
        this._game = entity._game;
        this._loadedAssets = entity._game._loadedAssets;
        this.isCurrentPlayer = entity.isCurrentPlayer;
        this._room = entity._room;
        this._entityData = this._game._vatController.entityData.get(this._entity.race);
    }

    public async load() {
        // create collision cube
        const box = MeshBuilder.CreateBox(this._entity.sessionId, { width: 1.5, height: 2.5, depth: 1.5 }, this._scene);
        box.visibility = 0;
        //box.setPivotMatrix(Matrix.Translation(0, 1, 0), false);

        // set collision mesh
        this.mesh = box;
        this.mesh.isPickable = true;
        this.mesh.isVisible = true;
        this.mesh.checkCollisions = true;
        this.mesh.showBoundingBox = true;
        this.mesh.position = new Vector3(this._entity.x, this._entity.y, this._entity.z);

        this.mesh.metadata = {
            sessionId: this._entity.sessionId,
            type: this._entity.type,
            race: this._entity.race,
            name: this._entity.name,
        };

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
        }*/

        // add selected image
        var material = this._scene.getMaterialByName("entity_selected");
        const selectedMesh = MeshBuilder.CreateCylinder("entity_selected_" + this._entity.race, { diameter: 2, height: 0.01, tessellation: 8 }, this._scene);
        selectedMesh.parent = box;
        selectedMesh.material = material;
        selectedMesh.isVisible = false;
        selectedMesh.isPickable = false;
        selectedMesh.checkCollisions = false;
        selectedMesh.position = new Vector3(0, -1, 0);
        this.selectedMesh = selectedMesh;

        // load player mesh
        let materialIndex = this._entity.material ?? 0;
        const playerMesh = this._entityData.mesh[materialIndex].createInstance(this._entity.type + "" + this._entity.sessionId);
        //playerMesh.parent = box;
        playerMesh.position.copyFrom(this.mesh.position);
        playerMesh.rotationQuaternion = null; // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
        if (this._entity.rotationFix) {
            playerMesh.rotation.set(0, this._entity.rotationFix, 0);
        }
        playerMesh.scaling.set(this._entity.scale, this._entity.scale, this._entity.scale);
        playerMesh.isPickable = false;
        playerMesh.checkCollisions = false;
        playerMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);

        this.playerMesh = playerMesh;

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

        // check for any equipment changes
        this._entity.entity.equipment.onAdd((e) => {
            this.attachEquipement();
        });
        this._entity.entity.equipment.onRemove((e) => {
            this.attachEquipement();
        });
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

    public attachEquipement() {
        if (!this._entity.bones) {
            return false;
        }

        if (!this._entity.animatorController) {
            return false;
        }

        // remove current equipped
        if (this.equipments.length > 0) {
            this.equipments.forEach((equipment) => {
                equipment.dispose();
            });
        }

        //
        this.equipments = [];

        // equip all items
        this._entity.equipment.forEach((e: EquipmentSchema) => {
            let item = this._game.getGameData("item", e.key);
            if (item && item.equippable) {
                let equipOptions = item.equippable;
                let key = PlayerSlots[e.slot];

                // if mesh needs to be added
                if (equipOptions.mesh) {
                    // create instance of mesh
                    let instance = this._entityData.items.get(item.key).createInstance("equip_" + this._entity.sessionId + "_" + e.key);
                    instance.instancedBuffers.bakedVertexAnimationSettingsInstanced = new Vector4(0, 0, 0, 0);

                    // or like this(so we don't need to sync it every frame)
                    instance.setParent(this.playerMesh);
                    instance.position.setAll(0);
                    instance.rotationQuaternion = undefined;
                    instance.rotation.setAll(0);

                    // if mesh offset required
                    if (equipOptions.scale) {
                        instance.scaling = new Vector3(equipOptions.scale, equipOptions.scale, equipOptions.scale);
                    }
                    if (equipOptions.offset_x) {
                        instance.position.x += equipOptions.offset_x;
                    }
                    if (equipOptions.offset_y) {
                        instance.position.y += equipOptions.offset_y;
                    }
                    if (equipOptions.offset_z) {
                        instance.position.z += equipOptions.offset_z;
                    }

                    // if rotationFix needed
                    if (equipOptions.rotation_x || equipOptions.rotation_y || equipOptions.rotation_z) {
                        // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
                        instance.rotationQuaternion = null;
                        instance.rotation.set(equipOptions.rotation_x ?? 0, equipOptions.rotation_y ?? 0, equipOptions.rotation_z ?? 0);
                    }

                    // add
                    this.equipments.push(instance);

                    /*
                        // skin item to player mesh
                        const totalCount = itemMeshMerged.getTotalVertices();
                        const weaponMI:any = [];
                        const weaponMW:any = [];
                        for (let i = 0; i < totalCount; i++) {
                            weaponMI.push(boneId, 0, 0, 0);
                            weaponMW.push(1, 0, 0, 0);
                        }
                        itemMeshMerged.setVerticesData(VertexBuffer.MatricesIndicesKind, weaponMI, false);
                        itemMeshMerged.setVerticesData(VertexBuffer.MatricesWeightsKind, weaponMW, false);

                       
                    /*
                    const weaponMesh = this._loadedAssets["ROOT_ITEM_" + e.key].createInstance("equip_" + this._entity.sessionId + "_" + e.key);
                    weaponMesh.isVisible = true;
                    weaponMesh.isPickable = false;
                    weaponMesh.checkCollisions = false;
                    weaponMesh.receiveShadows = false;
                    weaponMesh.showBoundingBox = true;

                    const skeletonAnim = this._entityData.skeletonForAnim[this._entity.animatorController._currentAnim.index];
                    let boneId = this._entity.bones[key];
                    let bone = skeletonAnim.bones[boneId];
                    weaponMesh.attachToBone(bone, this.playerMesh);
                    console.log(boneId, skeletonAnim);

                    weaponMesh.metadata = e;

                    // fix for black items
                    const selectedMaterial = weaponMesh.material ?? false;
                    if (selectedMaterial) {
                        selectedMaterial.needDepthPrePass = true;
                    }

                    // if mesh offset required
                    if (equipOptions.scale) {
                        weaponMesh.scaling = new Vector3(equipOptions.scale, equipOptions.scale, equipOptions.scale);
                    }
                    if (equipOptions.offset_x) {
                        weaponMesh.position.x += equipOptions.offset_x;
                    }
                    if (equipOptions.offset_y) {
                        weaponMesh.position.y += equipOptions.offset_y;
                    }
                    if (equipOptions.offset_z) {
                        weaponMesh.position.z += equipOptions.offset_z;
                    }

                    // if rotationFix needed
                    if (equipOptions.rotation) {
                        // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
                        weaponMesh.rotationQuaternion = null;
                        weaponMesh.rotation.set(equipOptions.rotation, 0, 0);
                    }

                    this.equipments.push(weaponMesh);
                    */
                }
            }
        });
    }

    public getAnimation() {
        return this._animationGroups;
    }
}
