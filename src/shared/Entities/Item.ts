import { Scene } from "@babylonjs/core/scene";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Room } from "colyseus.js";
import { UserInterface } from "../../client/Controllers/UserInterface";
import { PlayerInput } from "../../client/Controllers/PlayerInput";

import Config from "../Config";
import { dataDB } from "../Data/dataDB";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { randomNumberInRange } from "../Utils";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";

export class Item {
    public _scene: Scene;
    public _room: Room;
    public ui: UserInterface;
    public _input: PlayerInput;
    public _shadow;
    public _loadedAssets;

    // entity
    public entity;
    public sessionId;
    public mesh: AbstractMesh;
    public characterLabel: Rectangle;
    public type: string = "";

    public name: string = "";
    public key: string;
    public x: number;
    public y: number;
    public z: number;
    public rot: number;
    public quantity: number;

    //
    public meshData;

    // flags
    public blocked: boolean = false; // if true, player will not moved

    constructor(entity, room: Room, scene: Scene, ui: UserInterface, shadow: CascadedShadowGenerator, _loadedAssets: AssetContainer[]) {
        // setup class variables
        this._scene = scene;
        this._room = room;
        this._loadedAssets = _loadedAssets;
        this.ui = ui;
        this._shadow = shadow;
        this.sessionId = entity.sessionId;
        this.entity = entity;
        this.type = "item";

        // update player data from server data
        Object.assign(this, dataDB.get("item", entity.key));

        // update player data from server data
        Object.assign(this, this.entity);

        // spawn player
        this.spawn(entity);
    }

    public async spawn(entity) {
        //
        const box = MeshBuilder.CreateBox(
            this.entity.sessionId,
            {
                width: this.meshData.width ?? 1,
                height: this.meshData.height ?? 1,
                depth: this.meshData.depth ?? 1,
            },
            this._scene
        );
        box.visibility = 0;

        // set collision mesh
        this.mesh = box;
        this.mesh.name = entity.key + "_box";
        this.mesh.isPickable = true;
        this.mesh.isVisible = true;
        this.mesh.checkCollisions = false;
        this.mesh.showBoundingBox = true;
        this.mesh.position = new Vector3(this.entity.x, this.entity.y, this.entity.z);

        // offset mesh from the ground
        this.y = this.y + this.meshData.height / 2;
        this.mesh.rotation = new Vector3(0, randomNumberInRange(0, 360), 0);

        this.mesh.metadata = {
            sessionId: this.entity.sessionId,
            type: "item",
            key: this.key,
            name: this.entity.name,
        };

        // load player mesh
        const result = await this._loadedAssets["ITEM_" + entity.key].instantiateModelsToScene((name) => "instance_" + this.entity.sessionId, false, {
            doNotInstantiate: true,
        });
        const root = result.rootNodes[0];
        let playerMesh = root;

        /////////////////
        /*
        let modelToLoadKey = "LOADED_ITEM_" + this.key;
        console.log(this._loadedAssets);
        const playerMesh = this._loadedAssets[modelToLoadKey].createInstance("item_" + this.key);
        */

        // set initial player scale & rotation
        playerMesh.name = entity.key + "_mesh";
        playerMesh.rotationQuaternion = null; // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
        playerMesh.scaling = new Vector3(this.meshData.scale, this.meshData.scale, this.meshData.scale);
        playerMesh.isPickable = false;
        playerMesh.checkCollisions = false;
        playerMesh.parent = this.mesh;

        // add mesh to shadow generator
        //this._shadow.addShadowCaster(this.mesh, true);
        this.setPosition();

        //////////////////////////////////////////////
        // entity network event
        // colyseus automatically sends entity updates, so let's listen to those changes
        this.entity.onChange(() => {
            // make sure players are always visible
            this.mesh.isVisible = true;
            // update player data from server data
            Object.assign(this, this.entity);

            this.setPosition();
        });

        ///
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
                }
            })
        );

        // register hover out player
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnLeftPickTrigger, (ev) => {
                let item = ev.meshUnderPointer.metadata;
                this._room.send("pickup_item", {
                    sessionId: item.sessionId,
                });
            })
        );

        //////////////////////////////////////////////////////////////////////////
        // misc
        this.characterLabel = this.ui.createItemLabel(this);
    }

    public mergeMesh(key, mesh) {
        const allChildMeshes = mesh.getChildMeshes();
        const merged = Mesh.MergeMeshes(allChildMeshes, false, true, undefined, undefined, true);
        if (merged) {
            merged.name = key + "_merged";
        }
        return merged;
    }

    public update(delta) {}
    public updateServerRate(delta) {}

    // basic performance (only enable entities in a range around the player)
    public lod(_currentPlayer) {
        this.mesh.setEnabled(false);
        this.mesh.freezeWorldMatrix();
        let entityPos = this.position();
        let playerPos = _currentPlayer.position();
        let distanceFromPlayer = Vector3.Distance(playerPos, entityPos);
        if (distanceFromPlayer < Config.PLAYER_VIEW_DISTANCE) {
            this.mesh.unfreezeWorldMatrix();
            this.mesh.setEnabled(true);
        }
    }

    public setPosition() {
        this.mesh.position = this.position();
    }

    public position() {
        return new Vector3(this.x, this.y, this.z);
    }

    public remove() {
        if (this.characterLabel) {
            this.characterLabel.dispose();
        }
        if (this.mesh) {
            this.mesh.dispose();
        }
    }
}
