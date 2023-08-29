import { Scene } from "@babylonjs/core/scene";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Room } from "colyseus.js";

import { PlayerCamera } from "./Player/PlayerCamera";
import { EntityAnimator } from "./Entity/EntityAnimator";
import { EntityMove } from "./Entity/EntityMove";
import { EntityUtils } from "./Entity/EntityUtils";
import { EntityActions } from "./Entity/EntityActions";
import { EntityMesh } from "./Entity/EntityMesh";

import { UserInterface } from "../../client/Controllers/UserInterface";
import { NavMesh } from "../yuka-min";
import { AI_STATE } from "./Entity/AIState";
import Config from "../Config";
import { EntityState } from "./Entity/EntityState";
import { PlayerInput } from "../../client/Controllers/PlayerInput";
import { dataDB } from "../Data/dataDB";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";

export class Entity {
    public _scene: Scene;
    public _room: Room;
    public ui: UserInterface;
    public _input: PlayerInput;
    public _shadow;
    public _navMesh;
    public _loadedAssets;

    // controllers
    public cameraController: PlayerCamera;
    public animatorController: EntityAnimator;
    public moveController: EntityMove;
    public utilsController: EntityUtils;
    public actionsController: EntityActions;
    public meshController: EntityMesh;

    // entity
    public mesh: AbstractMesh; //outer collisionbox of player
    public playerMesh: AbstractMesh; //outer collisionbox of player
    public playerSkeleton;
    public debugMesh: Mesh;
    public selectedMesh: Mesh;
    public characterChatLabel: Rectangle;
    public characterLabel: Rectangle;
    public sessionId: string;
    public entity;
    public isCurrentPlayer: boolean;

    // character
    public type: string = "";
    public race: string = "";
    public name: string = "";
    public speed: string = "";
    public x: number;
    public y: number;
    public z: number;
    public rot: number;
    public health: number;
    public mana: number;
    public level: number;
    public experience: number;
    public location: string = "";
    public anim_state: number = EntityState.IDLE;
    public ai_state: number = 0;
    public isDead: boolean = false;
    public isDeadUI: boolean = false;

    //
    public abilities = [];
    public inventory = [];
    public equipment = [];

    // raceData
    public rotationFix;
    public meshIndex;
    public scale;
    public animationSpeed;
    public bones;
    public raceData;

    // flags
    public blocked: boolean = false; // if true, player will not moved

    constructor(entity, room: Room, scene: Scene, ui: UserInterface, shadow: CascadedShadowGenerator, navMesh: NavMesh, _loadedAssets: AssetContainer[]) {
        // setup class variables
        this._scene = scene;
        this._room = room;
        this._navMesh = navMesh;
        this._loadedAssets = _loadedAssets;
        this.ui = ui;
        this._shadow = shadow;
        this.sessionId = entity.sessionId; // network id from colyseus
        this.isCurrentPlayer = this._room.sessionId === entity.sessionId;
        this.entity = entity;
        this.type = "entity";

        // update player data from server data
        Object.assign(this, dataDB.get("race", entity.race));

        // set entity
        Object.assign(this, this.entity);

        // spawn player
        this.spawn(entity);
    }

    public async spawn(entity) {
        // load mesh controllers
        this.meshController = new EntityMesh(this);
        await this.meshController.load();
        this.mesh = this.meshController.mesh;
        this.playerMesh = this.meshController.playerMesh;
        this.debugMesh = this.meshController.debugMesh;
        this.selectedMesh = this.meshController.selectedMesh;
        this.playerSkeleton = this.meshController.skeleton;

        // add mesh to shadow generator
        this._shadow.addShadowCaster(this.meshController.mesh, true);

        // add all entity related stuff
        this.animatorController = new EntityAnimator(this.meshController.getAnimation(), this);
        this.moveController = new EntityMove(this.mesh, this._navMesh, this.isCurrentPlayer, this.speed);
        this.moveController.setPositionAndRotation(entity); // set next default position from server entity

        ///////////////////////////////////////////////////////////
        // entity network event
        // colyseus automatically sends entity updates, so let's listen to those changes
        this.entity.onChange(() => {
            // make sure players are always visible
            this.mesh.isVisible = true;

            // update player data from server data
            Object.assign(this, this.entity);

            // update player position
            this.moveController.setPositionAndRotation(this.entity);

            // do server reconciliation on client if current player only & not blocked
            if (this.isCurrentPlayer && !this.blocked) {
                this.moveController.reconcileMove(this.entity.sequence); // set default entity position
            }
        });

        //////////////////////////////////////////////////////////////////////////
        // entity register event

        //////////////////////////////////////////////////////////////////////////
        // player render loop
        this._scene.registerBeforeRender(() => {
            // animate player continuously
            this.animatorController.animate(this, this.mesh.position, this.moveController.getNextPosition());

            // if entity is selected, show
            if (this.selectedMesh && this.selectedMesh.visibility) {
                if (global.T5C.selectedEntity && global.T5C.selectedEntity.sessionId === this.sessionId) {
                    this.selectedMesh.isVisible = true;
                    this.selectedMesh.rotate(new Vector3(0, 0.1, 0), 0.01);
                } else {
                    this.selectedMesh.isVisible = false;
                }
            }
        });

        //////////////////////////////////////////////////////////////////////////
        // misc
        this.characterLabel = this.ui.createEntityLabel(this);
        this.characterChatLabel = this.ui.createEntityChatLabel(this);
    }

    public update(delta) {
        if (this.ai_state === AI_STATE.SEEKING || this.ai_state === AI_STATE.ATTACKING) {
            this.debugMesh.material = this._scene.getMaterialByName("debug_entity_active");
        }

        if (this.ai_state === AI_STATE.WANDER) {
            this.debugMesh.material = this._scene.getMaterialByName("debug_entity_neutral");
        }

        // what to do when an entity dies
        if (this.health < 1 && !this.isDead) {
            this.isDead = true;
            global.T5C.selectedEntity = null;
            this.meshController.selectedMesh.isVisible = false;
            this.meshController.mesh.actionManager.dispose();
            this.meshController.mesh.actionManager = null;
        }

        // tween entity
        if (this && this.moveController) {
            this.moveController.tween();
        }
    }

    public getPosition() {
        return new Vector3(this.x, this.y, this.z);
    }

    public updateSlowRate() {}

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

    public position() {
        return new Vector3(this.x, this.y, this.z);
    }

    public remove() {
        // delete any ui linked to entity
        this.characterLabel.dispose();
        this.characterChatLabel.dispose();

        // delete mesh, including equipment
        this.meshController.deleteMeshes();

        // unselect ?
        // todo: what is this for? it looks wrong.
        if (global.T5C.selectedEntity && global.T5C.selectedEntity.sessionId === this.sessionId) {
            global.T5C.selectedEntity = false;
        }
    }
}
