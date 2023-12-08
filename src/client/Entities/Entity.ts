import { Scene } from "@babylonjs/core/scene";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { Room } from "colyseus.js";

import { PlayerCamera } from "./Player/PlayerCamera";
import { EntityAnimator } from "./Entity/EntityAnimator";
import { EntityMove } from "./Entity/EntityMove";
import { EntityUtils } from "./Entity/EntityUtils";
import { EntityActions } from "./Entity/EntityActions";
import { EntityMesh } from "./Entity/EntityMesh";

import { UserInterface } from "../../client/Controllers/UserInterface";
import { NavMesh } from "../../shared/Libs/yuka-min";
import { AI_STATE } from "./Entity/AIState";
import { EntityState } from "../../shared/types";
import { PlayerInput } from "../../client/Controllers/PlayerInput";

import { GameController } from "../Controllers/GameController";
import { GameScene } from "../Screens/GameScene";
import { Player } from "./Player";

export class Entity extends TransformNode {
    public _scene: Scene;
    public _room: Room;
    public _ui: UserInterface;
    public _input: PlayerInput;
    public _shadow;
    public _navMesh;
    public _game: GameController;

    // controllers
    public cameraController: PlayerCamera;
    public animatorController: EntityAnimator;
    public moveController: EntityMove;
    public utilsController: EntityUtils;
    public actionsController: EntityActions;
    public meshController: EntityMesh;

    // entity
    public mesh: AbstractMesh; //outer collisionbox of player
    public playerSkeleton;
    public debugMesh: Mesh;
    public selectedMesh: Mesh;
    public characterChatLabel: Rectangle;
    public characterLabel: Rectangle;
    public sessionId: string;
    public entity;
    public isCurrentPlayer: boolean;
    public _currentPlayer: Player;

    // character
    public type: string = "";
    public race: string = "";
    public material: number = 0;
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
    public isMoving: boolean = false;
    public spawn_id: string = "";

    //
    public abilities = [];
    public inventory = [];
    public equipment = [];

    // interactable
    public spawnInfo;
    public interactableButtons;

    // raceData
    public rotationFix;
    public meshIndex;
    public scale;
    public animationSpeed;
    public bones;
    public materials;

    // state
    public debugMaterialActive;
    public debugMaterialNeutral;

    // flags
    public blocked: boolean = false; // if true, player will not moved

    constructor(name: string, scene: Scene, gamescene: GameScene, entity) {
        super(name, scene);

        // setup class variables
        this._scene = scene;
        this._room = gamescene.room;
        this._game = gamescene._game;
        this._navMesh = gamescene._navMesh;
        this._ui = gamescene._ui;
        this._shadow = gamescene._shadow;
        this.sessionId = entity.sessionId; // network id from colyseus
        this.isCurrentPlayer = this._room.sessionId === entity.sessionId;
        this.entity = entity;
        this._currentPlayer = gamescene._currentPlayer;
        this.type = "entity";

        // update player data from server data
        Object.assign(this, this._game.getGameData("race", entity.race));

        // set entity
        Object.assign(this, this.entity);

        this.name = this.sessionId;

        // get spawnInfo
        if (entity.type === "entity" && this._game.currentLocation.dynamic.spawns) {
            this.spawnInfo = this._game.currentLocation.dynamic.spawns[this.spawn_id] ?? null;
        }

        // get material
        this.debugMaterialActive = this._scene.getMaterialByName("debug_entity_active");
        this.debugMaterialNeutral = this._scene.getMaterialByName("debug_entity_neutral");

        // spawn player
        this.spawn(entity);
    }

    public async spawn(entity) {
        // load mesh controllers
        this.meshController = new EntityMesh(this);
        await this.meshController.load();
        this.mesh = this.meshController.mesh;
        this.debugMesh = this.meshController.debugMesh;
        this.selectedMesh = this.meshController.selectedMesh;
        this.playerSkeleton = this.meshController.skeleton;

        // add mesh to shadow generator
        //this._shadow.addShadowCaster(this.meshController.mesh, true);

        // set initial position & roation
        this.position = new Vector3(entity.x, entity.y, entity.z);
        this.rotation = new Vector3(0, entity.rot, 0);

        // add all entity related stuff
        this.animatorController = new EntityAnimator(this);
        this.moveController = new EntityMove(this);
        this.moveController.setPositionAndRotation(entity); // set next default position from server entity

        ///////////////////////////////////////////////////////////
        // entity network event
        // colyseus automatically sends entity updates, so let's listen to those changes
        this.entity.onChange(() => {
            // make sure players are always visible
            this.mesh.isVisible = true;

            // if taking damage, show damage bubble
            if (this.health !== this.entity.health) {
                let healthChange = this.entity.health - this.health;
                if (healthChange < 0 || healthChange > 1) {
                    this._ui._DamageText.addDamage(this, healthChange);
                }
            }

            if (this.type === "player" && this.anim_state !== this.entity.anim_state) {
                console.log("[SERVER] anim_state state has changed ", EntityState[this.entity.anim_state]);
            }

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
        // misc
        this.characterLabel = this._ui.createEntityLabel(this);
        this.characterChatLabel = this._ui.createEntityChatLabel(this);
        this.interactableButtons = this._ui.createInteractableButtons(this);
    }

    public update(delta): any {
        ////////////////////////////////////
        // what to do when an entity dies
        if (this.health < 1 && !this.isDead) {
            this.isDead = true;

            // remove from player selection
            this._game.selectedEntity = null;

            // remove selected mesh
            this.meshController.selectedMesh.isVisible = false;

            // remove any action managers
            if (this.meshController.mesh.actionManager) {
                this.meshController.mesh.actionManager.dispose();
                this.meshController.mesh.actionManager = null;
            }

            // hide interactable button
            if (this.interactableButtons) {
                this.interactableButtons.isVisible = false;
            }

            // hide any dialog this entity could be linked too
            if (this._ui.panelDialog.currentEntity && this._ui.panelDialog.currentEntity.sessionId === this.sessionId) {
                this._ui.panelDialog.clear();
                this._ui.panelDialog.close();
            }
        }

        ////////////////////////////////////
        if (this.health > 0) {
            this.isDead = false;
        }

        ////////////////////////////////////
        // animate player continuously
        this.animatorController.animate(this);

        ////////////////////////////////////
        // only do the below if entity is not dead
        if (!this.isDead) {
            // if entity is selected, show
            if (this.selectedMesh && this.selectedMesh.visibility) {
                if (this._game.selectedEntity && this._game.selectedEntity.sessionId === this.sessionId) {
                    this.selectedMesh.isVisible = true;
                    this.selectedMesh.rotate(new Vector3(0, 0.1, 0), 0.01);
                } else {
                    this.selectedMesh.isVisible = false;
                }
            }

            // if entity has aggro
            if (this.ai_state === AI_STATE.SEEKING || this.ai_state === AI_STATE.ATTACKING) {
                if (this.debugMesh) {
                    this.debugMesh.material = this.debugMaterialActive;
                }
            }

            // if entity lose aggro
            if (this.ai_state === AI_STATE.WANDER) {
                if (this.debugMesh) {
                    this.debugMesh.material = this.debugMaterialNeutral;
                }
            }

            // tween entity
            if (this && this.moveController) {
                this.moveController.tween();
            }
        }

        ////////////////////////////////////
        // animate player continuously
        this.animatorController.play(this);
    }

    public getPosition() {
        return new Vector3(this.position.x, this.position.y, this.position.z);
    }

    public updateSlowRate() {}

    public updateServerRate(delta) {}

    // basic performance LOD logic
    public lod(_currentPlayer) {
        if (_currentPlayer) {
            /*
            // hide everything
            this.mesh.setEnabled(false);
            this.mesh.freezeWorldMatrix();

            // hide gui
            this.characterLabel.isEnabled = false;
            this.characterChatLabel.isEnabled = false;

            this.meshController.equipments?.forEach((equipment) => {
                equipment.setEnabled(false);
                equipment.freezeWorldMatrix();
            });

            // only enable if close enough to local player
            let entityPos = new Vector3(this.x, this.y, this.z);
            let playerPos = new Vector3(_currentPlayer.x, _currentPlayer.y, _currentPlayer.z);
            let distanceFromPlayer = Vector3.Distance(playerPos, entityPos);
            if (distanceFromPlayer < this._game.config.PLAYER_VIEW_DISTANCE) {
                // show mesh
                this.mesh.unfreezeWorldMatrix();
                this.mesh.setEnabled(true);

                // show gui
                this.characterLabel.isEnabled = true;
                this.characterChatLabel.isEnabled = true;

                this.meshController.equipments?.forEach((equipment) => {
                    equipment.unfreezeWorldMatrix();
                    equipment.setEnabled(true);
                });
            }*/
        }
    }

    public remove() {
        // delete any ui linked to entity
        this.characterLabel.dispose();
        this.characterChatLabel.dispose();
        if (this.interactableButtons) {
            this.interactableButtons.dispose();
        }
        // delete mesh, including equipment
        this.meshController.deleteMeshes();

        // delete any action manager
        if (this.meshController.mesh.actionManager) {
            this.meshController.mesh.actionManager.dispose();
            this.meshController.mesh.actionManager = null;
        }

        // if was selected, make sure to unselect it
        if (this._game.selectedEntity && this._game.selectedEntity.sessionId === this.sessionId) {
            this._game.selectedEntity = false;
        }

        // remove selected mesh
        this.meshController.selectedMesh.isVisible = false;
    }
}
