import { Scene } from "@babylonjs/core/scene";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Room } from "colyseus.js";
import { UserInterface } from "../Controllers/UserInterface";
import { PlayerInput } from "../Controllers/PlayerInput";

import { randomNumberInRange } from "../../shared/Utils";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { GameController } from "../Controllers/GameController";
import { EntityNamePlate } from "./Entity/EntityNamePlate";

export class Item extends TransformNode {
    public _game: GameController;
    public _scene: Scene;
    public _room: Room;
    public _ui: UserInterface;
    public _input: PlayerInput;

    // entity
    public entity;
    public sessionId;
    public mesh;
    public overlay_mesh;
    public characterLabel: Rectangle;
    public type: string = "";

    public name: string = "";
    public key: string;
    public x: number;
    public y: number;
    public z: number;
    public rot: number;
    public qty: number;

    //
    public scale: number = 1;
    public health: number = 1;
    public meshData;
    public fakeShadow;
    public nameplateController;
    public nameplate;
    public spawnInfo;

    // flags
    public blocked: boolean = false; // if true, player will not moved

    constructor(name, scene: Scene, entity, room: Room, ui: UserInterface, game: GameController) {
        super(name, scene);

        // setup class variables
        this._scene = scene;
        this._game = game;
        this._room = room;
        this._ui = ui;

        // add entity data
        this.entity = entity;

        //
        this.nameplateController = new EntityNamePlate(this);

        // update player data from server data
        let item = this._game.getGameData("item", entity.key);
        Object.assign(this, item);

        // update player data from server data
        Object.assign(this, this.entity);

        //
        this.name = item.title;
        this.spawnInfo = {
            key: this.key,
        };

        // set parent metadata
        this.metadata = {
            sessionId: entity.sessionId,
            type: "item",
            name: entity.name,
        };

        // spawn item
        this.spawn(entity);
    }

    public async spawn(entity, mode = "instance") {
        /*
        // load item mesh
        if (mode === "instance") {
            // instance
            this.mesh = this._game._loadedAssets["ROOT_ITEM_" + entity.key].createInstance("TEST_" + entity.sessionId);
            this._game._loadedAssets["ROOT_ITEM_" + entity.key].setParent(null);
        } else if (mode === "clone") {
            // clone
            if (this._game._loadedAssets["ROOT_ITEM_" + entity.key]) {
                this.mesh = this._game._loadedAssets["ROOT_ITEM_" + entity.key].clone("TEST_" + entity.sessionId);
            } else {
                console.error("Could not find key: ROOT_ITEM_" + entity.key, this._game._loadedAssets);
            }

            // import normal
        } else {
            const result = await this._game._loadedAssets["ITEM_" + entity.key].instantiateModelsToScene((name) => "instance_" + this.entity.sessionId, false, {
                doNotInstantiate: false,
            });
            this.mesh = result.rootNodes[0] as Mesh;
        }*/

        let key = "ROOT_ITEM_" + entity.key;

        // load mesh if not already loaded
        if (!this._game._loadedAssets[key]) {
            await this._game._assetsCtrl.prepareItem(entity.key);
        }

        //
        this.mesh = this._game._loadedAssets[key].createInstance("GROUND_" + entity.sessionId);

        // set initial player scale & rotation
        this.mesh.parent = this;

        // set collision mesh
        this.mesh.name = entity.key + "_box";
        this.mesh.isPickable = true;
        this.mesh.isVisible = true;
        this.mesh.checkCollisions = false;
        this.mesh.showBoundingBox = false;
        this.mesh.receiveShadows = false;

        // offset mesh from the ground
        let meshSize = this.mesh.getBoundingInfo().boundingBox.extendSize;
        this.mesh.position.y += meshSize.y * this.meshData.scale;
        this.mesh.rotationQuaternion = null; // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
        this.mesh.rotation = new Vector3(0, randomNumberInRange(0, 360), 0);
        this.mesh.scaling = new Vector3(this.meshData.scale, this.meshData.scale, this.meshData.scale);

        // set mesh metadata
        this.mesh.metadata = {
            sessionId: this.entity.sessionId,
            type: "item",
            key: this.key,
            name: this.entity.name,
        };

        let shadowMesh = this._game._loadedAssets["DYNAMIC_shadow_01"].createInstance("shadow_" + this.sessionId);
        shadowMesh.parent = this;
        shadowMesh.isPickable = false;
        shadowMesh.checkCollisions = false;
        shadowMesh.doNotSyncBoundingInfo = true;
        shadowMesh.position = new Vector3(0, 0.04, 0);
        this.fakeShadow = shadowMesh;

        // add nameplate
        //this.nameplate = this.nameplateController.addNamePlate();

        // set position
        this.setPosition();

        //////////////////////////////////////////////
        // entity network event
        // colyseus automatically sends entity updates, so let's listen to those changes
        this.entity.onChange(() => {
            // update player data from server data
            Object.assign(this, this.entity);

            // set item position
            this.setPosition();
        });

        ///
        // start action manager
        this.mesh.actionManager = new ActionManager(this._scene);

        // register hover over player
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (ev) => {
                let mesh = ev.meshUnderPointer;
                if (mesh) {
                    mesh.overlayColor = new Color3(1, 1, 1);
                    mesh.overlayAlpha = 0.3;
                    mesh.renderOverlay = true;
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
                    mesh.renderOverlay = false;
                }
                if (this.mesh.actionManager) {
                    this.mesh.actionManager.hoverCursor = this._ui._Cursor.get();
                }
            })
        );

        //////////////////////////////////////////////////////////////////////////
        // misc
        //this.characterLabel = this._ui.createItemLabel(this);
    }

    public lod(_currentPlayer) {
        if (!this.mesh) {
            return false;
        }

        // only enable if close enough to local player
        let entityPos = this.getPosition();
        let playerPos = _currentPlayer.getPosition();
        let distanceFromPlayer = Vector3.Distance(playerPos, entityPos);

        if (distanceFromPlayer < this._game.config.PLAYER_VIEW_DISTANCE) {
            this.setEnabled(true);
            this.unfreezeWorldMatrix();
        } else {
            // hide everything
            this.setEnabled(false);
            this.freezeWorldMatrix();
        }
    }

    public update(delta) {}
    public updateServerRate(delta) {}
    public updateSlowRate(delta) {}

    public setPosition() {
        this.position = this.getPosition();
    }

    public getPosition() {
        return new Vector3(this.x, this.y, this.z);
    }

    public remove() {
        if (this.nameplate) {
            this.nameplate.dispose();
        }

        if (this.fakeShadow) {
            this.fakeShadow.dispose();
        }
        if (this.mesh) {
            this.mesh.dispose();
        }
    }
}
