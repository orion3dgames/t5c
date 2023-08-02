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
            const sphere = MeshBuilder.CreateCylinder("debug_" + this._entity.race, { diameter: Config.MONSTER_AGGRO_DISTANCE * 2, height: 0.1 }, this._scene);
            sphere.isVisible = false;
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
        const result = this._loadedAssets["RACE_" + this._entity.race].instantiateModelsToScene();
        const playerMesh = result.rootNodes[0];
        this._animationGroups = result.animationGroups;
        this._skeleton = result.skeletons[0];

        /////////////////////////////
        // equip weapon
        if (this._entity.type === "player") {
            let boneId = this._entity.bones.WEAPON_1;
            let bone = this._skeleton.bones[boneId];
            const weapon = this._loadedAssets["ITEM_sword_01"].instantiateModelsToScene((name) => "PlayerSword");
            const weaponMesh = weapon.rootNodes[0];
            weaponMesh.attachToBone(bone, playerMesh);
            this.equipments.push(weaponMesh);
        }
        /////////////////////////////

        // set initial player scale & rotation

        playerMesh.name = this._entity.sessionId + "_mesh";
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
        //this.mesh.actionManager.isRecursive = true;

        // setup collisions for current player
        if (this.isCurrentPlayer) {
            // teleport trigger
            let targetMeshes = this._scene.getMeshesByTags("teleport");
            targetMeshes.forEach((mesh) => {
                this.mesh.actionManager.registerAction(
                    new ExecuteCodeAction(
                        {
                            trigger: ActionManager.OnIntersectionEnterTrigger,
                            parameter: mesh,
                        },
                        () => {
                            if (this.isCurrentPlayer) {
                                this._room.send("playerTeleport", mesh.metadata.location);
                            }
                        }
                    )
                );
            });
        }

        // register hover over player
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (ev) => {
                let mesh = ev.meshUnderPointer;
                for (const childMesh of mesh.getChildMeshes()) {
                    childMesh.overlayColor = new Color3(1, 1, 1);
                    childMesh.overlayAlpha = 0.3;
                    childMesh.renderOverlay = true;
                    //this._ui._hightlight.addMesh(childMesh as Mesh, new Color3(1, 1, 1));
                    /*
                    childMesh.outlineColor = new Color3(0, 1, 0);
                    childMesh.outlineWidth = 0.03;
                    childMesh.renderOutline = true;
                    */
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
                    //childMesh.renderOutline = false;
                }
            })
        );
    }

    public getAnimation() {
        return this._animationGroups;
    }
}
