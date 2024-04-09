import { Scene } from "@babylonjs/core/scene";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { PointerEventTypes, PointerInfo } from "@babylonjs/core/Events/pointerEvents";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

import { GameController } from "../Controllers/GameController";
import { NavMesh } from "../../shared/Libs/yuka-min";
import { Room } from "colyseus.js";
import { PlayerSchema } from "../../server/rooms/schema/PlayerSchema";
import { PlayerCamera } from "./Player/PlayerCamera";
import { EntityUtils } from "./Entity/EntityUtils";
import { EntityActions } from "./Entity/EntityActions";
import { Entity } from "./Entity";
import { PlayerInput } from "../../client/Controllers/PlayerInput";
import { UserInterface } from "../../client/Controllers/UserInterface";
import State from "../../client/Screens/Screens";
import { Ability, ServerMsg } from "../../shared/types";
import { GameScene } from "../Screens/GameScene";

export class Player extends Entity {
    public game;
    public entities;
    public interval;

    public isCasting: boolean = false;
    public castingDigit: number = 0;
    public castingTimer;
    public castingElapsed: number = 0;
    public castingTarget: number = 0;
    public ability_in_cooldown;

    public onPointerObservable;

    public player_data;
    public moveDecal;

    public closestEntity;
    public closestEntityDistance;

    public input_sequence: number = 0;

    constructor(name, scene, gamescene: GameScene, entity) {
        super(name, scene, gamescene, entity);

        this.entities = gamescene._entities;

        this._input = gamescene._input;

        this.ability_in_cooldown = [false, false, false, false, false, false, false, false, false, false, false];

        this.type = "player";

        this.spawnPlayer();
    }

    private async spawnPlayer() {
        // add player controllers
        this.utilsController = new EntityUtils(this._scene, this._room);
        this.cameraController = new PlayerCamera(this);
        this.actionsController = new EntityActions(this._scene, this._game._loadedAssets, this.entities);

        // register player server messages
        this.registerServerMessages();

        // player mouse events
        this.onPointerObservable = this._scene.onPointerObservable.add((pointerInfo: any) => {
            // on left mouse click
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 0) {
                this.leftClick(pointerInfo);
            }

            // on right mouse click
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 2) {
                this.rightClick(pointerInfo);
            }

            // on wheel mouse
            if (pointerInfo.type === PointerEventTypes.POINTERWHEEL) {
                /////////////////////////////////////////////////////////////////////
                // camera zoom on mouse wheel
                this.cameraController.zoom(pointerInfo.event.deltaY);
            }

            // check if selected entity is too far
            // todo: should be done on server side?
            if (this._game.selectedEntity && this._game.selectedEntity.sessionId) {
                let currentPos = this.getPosition();
                let targetPos = this._game.selectedEntity.getPosition();
                let distanceBetween = Vector3.Distance(currentPos, targetPos);
                if (distanceBetween > this._game.config.PLAYER_LOSE_FOCUS_DISTANCE) {
                    this._game.selectedEntity = null;
                }
            }
        });
    }

    getMeshMetadata(pointerInfo) {
        if (!pointerInfo._pickInfo.pickedMesh) return false;

        if (!pointerInfo._pickInfo.pickedMesh.metadata) return false;

        if (pointerInfo._pickInfo.pickedMesh.metadata === null) return false;

        return pointerInfo._pickInfo.pickedMesh.metadata;
    }

    public rightClick(pointerInfo) {
        let metadata = this.getMeshMetadata(pointerInfo);

        if (!metadata) return false;

        if (metadata.type === "entity") {
            let target = this.entities[metadata.sessionId];
        }
    }

    // process left click for player
    public leftClick(pointerInfo) {
        let metadata = this.getMeshMetadata(pointerInfo);

        if (!metadata) return false;

        // select entity
        if (metadata.type === "player" || metadata.type === "entity") {
            // select entity
            let targetSessionId = metadata.sessionId;
            let target = this.entities.get(targetSessionId);
            this._game.selectedEntity = target;

            // display nameplate for a certain time for any entity right clicked
            if (target.characterLabel) {
                target.characterLabel.isVisible = true;
            }

            // if spawninfo available
            if (!target.spawnInfo) return false;

            // if targets is aggresive
            // note: need to find a better wayt to do this, not linked to hotbar
            if (target.spawnInfo.aggressive) {
                // send to server
                this._game.sendMessage(ServerMsg.PLAYER_HOTBAR_ACTIVATED, {
                    senderId: this._room.sessionId,
                    targetId: target ? target.sessionId : false,
                    digit: 1,
                });
                return false;
            }

            // if interactable target
            if (!target.spawnInfo.interactable) return false;

            // if close enough, open dialog
            let playerPos = this.getPosition();
            let entityPos = target.getPosition();
            let distanceBetween = Vector3.Distance(playerPos, entityPos);
            if (distanceBetween < this._game.config.PLAYER_INTERACTABLE_DISTANCE) {
                this._ui.panelDialog.open(target);

                // stop any movement
                // todo: improve
                this._input.left_click = false;
                this._input.vertical = 0;
                this._input.horizontal = 0;
                this._input.player_can_move = false;
            }
        }

        /*
        // pick up item
        if (metadata.type === "item") {
            this._game.sendMessage(ServerMsg.PLAYER_PICKUP, {
                sessionId: metadata.sessionId,
            });
        }

        // move to clicked point
        if (metadata.type === "environment" && !this.isDead) {
            // deselect any entity
            this._game.selectedEntity = false;

            /*
            // removed click to move
            // todo: add client prediction.
            let destination = pointerInfo._pickInfo.pickedPoint;
            let pickedMesh = pointerInfo._pickInfo.pickedMesh;

            const foundPath = this._navMesh.getRegionForPoint(destination);
            if (foundPath) {
                // remove decal if already exist
                if (this.moveDecal) {
                    this.moveDecal.dispose();
                }

                // add decal to show destination
                var decalMaterial = this._scene.getMaterialByName("decal_target");
                this.moveDecal = MeshBuilder.CreateDecal("decal", pickedMesh, { position: destination });
                this.moveDecal.material = decalMaterial;

                // remove decal after 1 second
                setTimeout(() => {
                    this.moveDecal.dispose();
                }, 1000);

                // send to server
                this._game.sendMessage(ServerMsg.PLAYER_MOVE_TO, {
                    x: destination._x,
                    y: destination._y,
                    z: destination._z,
                });
            }
            
        }
        */
    }

    // update at engine rate 60fps
    public update(delta) {
        // run super function first
        super.update(delta);

        if (this && this.moveController) {
            // global camera rotation
            this._game.camY = this.cameraController._camRoot.rotation.y;

            // tween entity
            this.moveController.tween();
        }

        // move camera as player moves
        this.cameraController.follow();
    }

    // update at server rate
    public updateServerRate(delta) {
        // run super function first
        super.updateServerRate(delta);

        // process player movement
        this.moveController.processMove();

        ///////////// ENVIRONMENT LOD ///////////////////////////
        // only show meshes close to us
        /*
        let currentPos = this.getPosition();
        let key = "ENV_" + this._game.currentLocation.mesh;
        let allMeshes = this._game._loadedAssets[key]?.loadedMeshes ?? [];
        allMeshes.forEach((element) => {
            let distanceTo = Vector3.Distance(element.getAbsolutePosition(), currentPos);
            element.unfreezeWorldMatrix();
            element.setEnabled(true);
            if (distanceTo < 10) {
                element.unfreezeWorldMatrix();
                element.setEnabled(true);
            }
        });*/

        ///////////// ABILITY & CASTING EVENTS ///////////////////////////
        // if digit pressed
        if (this._input.digit_pressed > 0 && !this.isCasting) {
            // get all necessary vars
            let digit = this._input.digit_pressed;
            let target = this._game.selectedEntity;

            // send to server
            this._game.sendMessage(ServerMsg.PLAYER_HOTBAR_ACTIVATED, {
                senderId: this._room.sessionId,
                targetId: target ? target.sessionId : false,
                digit: digit,
            });

            // clear digit
            this._input.digit_pressed = 0;
        }

        // check if casting
        if (this.isCasting === true) {
            // increment casting timer
            this._ui._CastingBar.open();
            this.castingElapsed += delta; // increment casting timer by server delta
            let widthInPercentage = ((this.castingElapsed / this.castingTarget) * 100) / 100; // percentage between 0 and 1
            let text = this.castingElapsed + "/" + this.castingTarget;
            let width = widthInPercentage;
            this._ui._CastingBar.update(text, width);
        }

        // check for cooldowns (estethic only as server really controls cooldowns)
        this.ability_in_cooldown.forEach((cooldown, digit) => {
            if (cooldown > 0) {
                let cooldownUI = this._ui.MAIN_ADT.getControlByName("ability_" + digit + "_cooldown");
                let ability = this.getAbilityByDigit(digit) as Ability;
                if (ability && cooldownUI) {
                    this.ability_in_cooldown[digit] -= delta;
                    let percentage = ((this.ability_in_cooldown[digit] / ability.cooldown) * 100) / 100;
                    cooldownUI.height = percentage;
                }
            }
        });

        ///////////// RESSURECT EVENTS ///////////////////////////
        // if dead
        if (!this.isDeadUI && this.health < 1) {
            this._ui._RessurectBox.open();
            this.cameraController.bw(true);
            this.isDeadUI = true;
        }

        // if ressurect
        if (this.isDeadUI && this.health > 0) {
            this.cameraController.bw(false);
            this._ui._RessurectBox.close();
            this.isDeadUI = false;
        }
    }

    public updateSlowRate(delta: any): void {
        // run super function first
        super.updateSlowRate(delta);

        ///////////// DIALOG ///////////////////////////
        // only if moving, look for the closest interactable entities.
        if (this.isMoving) {
            // look for closest npc
            // todo: maybe this is a silly way?
            this.findCloseToInteractableEntity();
            //console.log("closest entity is ", this.closestEntity.name, this.closestEntityDistance);

            // if close enough, show interactable button
            if (this.closestEntityDistance < 5 && this.closestEntity.interactableButtons) {
                this.closestEntity.interactableButtons.isVisible = true;
            }

            // if far enough, hide interactable button & any open dialog
            if (this.closestEntityDistance > 5 && this.closestEntity.interactableButtons) {
                this._ui.panelDialog.close();
            }
        }
    }

    /**
     * This function is called every time the player moves, so that
     * the closest interactable entity can be highlighted on screen.
     */
    public findCloseToInteractableEntity() {
        let minDistanceSquared = Infinity;
        let playerPos = this.getPosition();
        this.entities.forEach((entity) => {
            if (entity.type === "entity" && entity.interactableButtons && entity.health > 0) {
                entity.interactableButtons.isVisible = false;
                let entityPos = entity.getPosition();
                let distanceSquared = Vector3.Distance(playerPos, entityPos);
                if (distanceSquared < minDistanceSquared) {
                    this.closestEntity = entity;
                    this.closestEntityDistance = distanceSquared;
                    minDistanceSquared = distanceSquared;
                }
            }
        });
    }

    public getAbilityByDigit(digit): Ability | boolean {
        let found = false;
        this.player_data.hotbar.forEach((element) => {
            if (element.digit === digit) {
                found = this._game.getGameData("ability", element.key);
            }
        });
        return found;
    }

    // player is casting
    public startCasting(data) {
        let digit = data.digit;
        let ability = this.getAbilityByDigit(digit) as Ability;
        if (ability) {
            this.isCasting = true;
            this.castingElapsed = 0;
            this.castingTarget = ability.castTime;
            this.castingDigit = digit;
            this._ui._CastingBar.open();
        }
    }

    // player cancel casting
    public stopCasting(data) {
        this.isCasting = false;
        this.castingElapsed = 0;
        this.castingTarget = 0;
        this.castingDigit = 0;
        this._ui._CastingBar.close();
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // server message handler

    public registerServerMessages() {
        this._room.onMessage(ServerMsg.SERVER_MESSAGE, (data) => {
            this._ui._ChatBox.addNotificationMessage(data.type, data.message, data.message);
        });

        // on teleport confirmation
        this._room.onMessage(ServerMsg.PLAYER_TELEPORT, (location) => {
            console.log(location);
            this.teleport(location);
        });

        // server confirm player can start casting
        this._room.onMessage(ServerMsg.PLAYER_CASTING_START, (data) => {
            console.log("ServerMsg.PLAYER_CASTING_START", data);
            this.startCasting(data);
        });

        this._room.onMessage(ServerMsg.PLAYER_CASTING_CANCEL, (data) => {
            console.log("ServerMsg.PLAYER_CASTING_CANCEL", data);
            this.stopCasting(data);
        });

        // server confirms ability can be cast
        this._room.onMessage(ServerMsg.PLAYER_ABILITY_CAST, (data) => {
            console.log("ServerMsg.PLAYER_ABILITY_CAST", data);
            let digit = data.digit;
            let ability = this.getAbilityByDigit(digit) as Ability;
            if (ability) {
                // if you are sender, cancel casting and strat cooldown on client
                if (data.fromId === this.sessionId) {
                    // cancel casting
                    this.castingElapsed = 0;
                    this.castingTarget = 0;
                    this.isCasting = false;
                    this._ui._CastingBar.close();
                    this.ability_in_cooldown[digit] = ability.cooldown; // set cooldown
                }

                // action ability
                this.actionsController.process(this, data, ability);
            }
        });
    }

    public async remove() {
        super.remove();

        // remove any pointer event
        if (this.onPointerObservable && this._scene.onPointerObservable.hasObservers()) {
            this._scene.onBeforeRenderObservable.remove(this.onPointerObservable);
        }
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // to refactor

    /**
     * when current player quits the game
     */
    public async quit() {
        // leave colyseus rooms
        await this._room.leave();
        await this._game.currentChat.leave();

        // clear cached chats
        this._game.currentChats = [];

        // switch scene
        this._game.setScene(State.CHARACTER_SELECTION);
    }

    public async teleport(location) {
        // leave colyseus room
        await this._room.leave();
        //await this._game.currentChat.leave();

        // update auth data
        this._game.setLocation(location);

        // switch scene
        this._game.setScene(State.GAME);
    }
}
