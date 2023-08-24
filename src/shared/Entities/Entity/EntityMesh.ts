import { Scene } from "@babylonjs/core/scene";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import Config from "../../Config";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math";
import { Entity } from "../Entity";
import { Skeleton } from "@babylonjs/core/Bones/skeleton";
import { PlayerSlots } from "../../../shared/Data/ItemDB";
import { dataDB } from "../../../shared/Data/dataDB";

export class EntityMesh {
    private _entity: Entity;
    private _scene: Scene;
    private _ui;
    private _loadedAssets;
    private _room;
    private _animationGroups: AnimationGroup[];
    private _skeleton: Skeleton;
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
        this._loadedAssets = entity._loadedAssets;
        this.isCurrentPlayer = entity.isCurrentPlayer;
        this._room = entity._room;
    }

    public async load() {
        // create collision cube
        const box = MeshBuilder.CreateBox(this._entity.sessionId, { width: 1.5, height: 2.5, depth: 1.5 }, this._scene);
        box.visibility = 0;
        box.setPivotMatrix(Matrix.Translation(0, 1, 0), false);

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
        if (this._entity.type === "entity") {
            var material = this._scene.getMaterialByName("debug_entity_neutral");
            const sphere = MeshBuilder.CreateTorus("debug_" + this._entity.race, { diameter: Config.MONSTER_AGGRO_DISTANCE * 2, thickness: 0.1 }, this._scene);
            sphere.isVisible = true;
            sphere.position = new Vector3(0, -1, 0);
            sphere.parent = box;
            sphere.material = material;
            this.debugMesh = sphere;
        }

        // add selected image
        var material = this._scene.getMaterialByName("entity_selected");
        const selectedMesh = MeshBuilder.CreateCylinder("entity_selected_" + this._entity.race, { diameter: 2, height: 0.01, tessellation: 10 }, this._scene);
        selectedMesh.parent = box;
        selectedMesh.material = material;
        selectedMesh.isVisible = false;
        selectedMesh.isPickable = false;
        selectedMesh.checkCollisions = false;
        selectedMesh.position = new Vector3(0, -1, 0);
        this.selectedMesh = selectedMesh;

        // load player mesh
        /*
        let modelToLoad = "RACE_" + this._entity.race;
        let modelToLoadKey = "LOADED_RACE_" + this._entity.race;

        let mergedMesh = this.mergeMeshAndSkeleton(
            modelToLoad,
            this._loadedAssets[modelToLoadKey].rootNodes[0],
            this._loadedAssets[modelToLoadKey].skeletons[0]
        );
        let instance = mergedMesh.createInstance("player_" + this._entity.race);
        const playerMesh = instance;
        this._animationGroups = this._loadedAssets[modelToLoadKey].animationGroups;
        this._skeleton = this._loadedAssets[modelToLoadKey].skeletons[0];
        */

        // load player mesh
        let key = "RACE_" + this._entity.race;
        const result = this._loadedAssets[key].instantiateModelsToScene(() => {
            return key;
        });
        const playerMesh = result.rootNodes[0];
        this._animationGroups = result.animationGroups;
        this._skeleton = result.skeletons[0];

        // set initial player scale & rotation
        //playerMesh.name = this._entity.sessionId + "_mesh";
        playerMesh.parent = box;
        playerMesh.rotationQuaternion = null; // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
        if (this._entity.rotationFix) {
            playerMesh.rotation.set(0, this._entity.rotationFix, 0);
        }
        playerMesh.scaling.set(this._entity.scale, this._entity.scale, this._entity.scale);
        playerMesh.isPickable = false;
        playerMesh.checkCollisions = false;
        playerMesh.position = new Vector3(0, -1, 0);
        this.playerMesh = playerMesh;

        // start action manager
        this.mesh.actionManager = new ActionManager(this._scene);

        // register hover over player
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (ev) => {
                let mesh = ev.meshUnderPointer;
                for (const childMesh of mesh.getChildMeshes()) {
                    childMesh.overlayColor = new Color3(1, 1, 1);
                    childMesh.overlayAlpha = 0.3;
                    childMesh.renderOverlay = true;
                }
            })
        );

        // register hover out player
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, (ev) => {
                let mesh = ev.meshUnderPointer;
                for (const childMesh of mesh.getChildMeshes()) {
                    childMesh.renderOverlay = false;
                    this._ui._hightlight.removeMesh(childMesh as Mesh);
                }
            })
        );

        // check for any equipemnt changes
        this._entity.entity.equipment.onAdd((e) => {
            this.refreshMeshes(e);
        });
        this._entity.entity.equipment.onRemove((e) => {
            this.refreshMeshes(e);
        });
    }

    mergeMeshAndSkeleton(key, mesh, skeleton) {
        // pick what you want to merge
        const allChildMeshes = mesh.getChildTransformNodes(true)[0].getChildMeshes(false);

        // Ignore Backpack because pf different attributes
        // https://forum.babylonjs.com/t/error-during-merging-meshes-from-imported-glb/23483
        //const childMeshes = allChildMeshes.filter((m) => !m.name.includes("Backpack"));

        // multiMaterial = true
        const merged = Mesh.MergeMeshes(allChildMeshes, false, true, undefined, undefined, true);
        if (merged) {
            merged.name = key + "_MergedModel";
            merged.skeleton = skeleton;
        }
        return merged;
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

    public refreshMeshes(e) {
        if (!this._entity.bones) {
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
        this._entity.equipment.forEach((e) => {
            let item = dataDB.get("item", e.key);
            if (item && item.equippable) {
                let equipOptions = item.equippable;
                let key = PlayerSlots[e.slot];

                // if mesh needs to be added
                if (equipOptions.mesh) {
                    let boneId = this._entity.bones[key];
                    let bone = this._skeleton.bones[boneId];
                    const weapon = this._loadedAssets["ITEM_" + e.key].instantiateModelsToScene((name) => "player_" + e.key);
                    const weaponMesh = weapon.rootNodes[0];
                    weaponMesh.parent = this.playerMesh;
                    weaponMesh.attachToBone(bone, this.playerMesh);

                    weaponMesh.scaling = new Vector3(item.meshData.scale, item.meshData.scale, item.meshData.scale);

                    // if rotationFix neede
                    if (equipOptions.rotation) {
                        // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
                        weaponMesh.rotationQuaternion = null;
                        weaponMesh.rotation.set(equipOptions.rotation, 0, 0);
                    }

                    // if mesh offset required
                    if (equipOptions.offset_x) {
                        weaponMesh.position.x += equipOptions.offset_x;
                    }
                    if (equipOptions.offset_z) {
                        weaponMesh.position.z += equipOptions.offset_z;
                    }

                    this.equipments.push(weaponMesh);
                }
            }
        });
    }

    public getAnimation() {
        return this._animationGroups;
    }
}
