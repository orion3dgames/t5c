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

import { EntityState } from "../../server/rooms/schema/EntityState";
import { UserInterface } from "../../client/Controllers/UserInterface";
import { PlayerInput } from "../../client/Controllers/PlayerInput";

import Config from "../Config";

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

    public name: string = "";
    public x: number;
    public y: number;
    public z: number;
    public rot: number;

    // raceData
    public rotationFix;
    public scale: number = 1;

    // flags
    public blocked: boolean = false; // if true, player will not moved

    constructor(entity: EntityState, room: Room, scene: Scene, ui: UserInterface, shadow: CascadedShadowGenerator, _loadedAssets: AssetContainer[]) {
        // setup class variables
        this._scene = scene;
        this._room = room;
        this._loadedAssets = _loadedAssets;
        this.ui = ui;
        this._shadow = shadow;
        this.sessionId = entity.sessionId;
        this.entity = entity;

        // update player data from server data
        Object.assign(this, this.entity);

        // spawn player
        this.spawn(entity);
    }

    public async spawn(entity) {
        // load player mesh
        const result = await this._loadedAssets[entity.key].instantiateModelsToScene();
        const playerMesh = result.rootNodes[0];

        // set initial player scale & rotation
        playerMesh.name = entity.sessionId + "_apple";
        playerMesh.rotationQuaternion = null; // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
        if (entity.rotationFix) {
            playerMesh.rotation.set(0, entity.rotationFix, 0);
        }
        playerMesh.scaling = new Vector3(0.25, 0.25, 0.25);
        playerMesh.isPickable = true;
        playerMesh.checkCollisions = false;
        playerMesh.parent = this.mesh;
        this.mesh = playerMesh;

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
                mesh.renderOutline = true;
                mesh.outlineColor = new Color3(0, 1, 0);
                mesh.outlineWidth = 3;
            })
        );

        // register hover out player
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, (ev) => {
                let mesh = ev.meshUnderPointer;
                mesh.renderOutline = false;
            })
        );

        //////////////////////////////////////////////////////////////////////////
        // misc
        //this.characterLabel = this.ui.createEntityLabel(this);
    }

    public update(delta) {}

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
        this.characterLabel.dispose();
        this.mesh.dispose();
    }
}
