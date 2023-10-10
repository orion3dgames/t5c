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

    constructor(
        entity: PlayerSchema,
        room: Room,
        scene: Scene,
        ui: UserInterface,
        shadow: CascadedShadowGenerator,
        navMesh: NavMesh,
        game: GameController,
        input: PlayerInput,
        entities
    ) {
        super(entity, room, scene, ui, shadow, navMesh, game);

        this.entities = entities;

        this._input = input;

        this.ability_in_cooldown = [false, false, false, false, false, false, false, false, false, false, false];

        this.type = "player";

        this.spawnPlayer(input);
    }

    private async spawnPlayer(input) {
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

    // display nameplate for a certain time for any entity right clicked
    public rightClick(pointerInfo) {
        let metadata = this.getMeshMetadata(pointerInfo);

        if (!metadata) return false;

        let target = this.entities[metadata.sessionId];

        if (target) {
            // show entity label
            target.characterLabel.isVisible = true;

            // hide it automatically after PLAYER_NAMEPLATE_TIMEOUT
            setTimeout(function () {
                target.characterLabel.isVisible = false;
            }, this._game.config.PLAYER_NAMEPLATE_TIMEOUT);
        }
    }

    // process left click for player
    public leftClick(pointerInfo) {
        let metadata = this.getMeshMetadata(pointerInfo);

        if (!metadata) return false;

        // select entity
        if (metadata.type === "player" || metadata.type === "entity") {
            let targetSessionId = metadata.sessionId;
            let target = this.entities[targetSessionId];
            this._game.selectedEntity = target;
        }

        // pick up item
        if (metadata.type === "item") {
            this._room.send(ServerMsg.PLAYER_PICKUP, metadata.sessionId);
        }

        // move to clicked point
        if (metadata.type === "environment" && !this.isDead) {
            let destination = pointerInfo._pickInfo.pickedPoint;
            let pickedMesh = pointerInfo._pickInfo.pickedMesh;

            const foundPath: any = this._navMesh.checkPath(this.getPosition(), destination);
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
                this._room.send(ServerMsg.PLAYER_MOVE_TO, {
                    x: destination._x,
                    y: destination._y,
                    z: destination._z,
                });
            }
        }
    }

    public updateSlowRate() {}

    // update at engine rate 60fps
    public update(delta) {
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
        // only show meshes close to us
        let currentPos = this.getPosition();
        let key = "ENV_" + this._game.currentLocation.mesh;
        let allMeshes = this._game._loadedAssets[key].loadedMeshes;
        allMeshes.forEach((element) => {
            let distanceTo = Vector3.Distance(element.getAbsolutePosition(), currentPos);
            element.unfreezeWorldMatrix();
            element.setEnabled(true);
            if (distanceTo < 36) {
                element.unfreezeWorldMatrix();
                element.setEnabled(true);
            }
        });

        // if digit pressed
        if (this._input.digit_pressed > 0 && !this.isCasting) {
            // get all necessary vars
            let digit = this._input.digit_pressed;
            let target = this._game.selectedEntity;

            // send to server
            this._room.send(ServerMsg.PLAYER_ABILITY_PRESSED, {
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
            this.ui._CastingBar.open();
            this.castingElapsed += delta; // increment casting timer by server delta
            let widthInPercentage = ((this.castingElapsed / this.castingTarget) * 100) / 100; // percentage between 0 and 1
            let text = this.castingElapsed + "/" + this.castingTarget;
            let width = widthInPercentage;
            this.ui._CastingBar.update(text, width);
        }

        // check for cooldowns  (estethic only as server really controls cooldowns)
        this.ability_in_cooldown.forEach((cooldown, digit) => {
            if (cooldown > 0) {
                let cooldownUI = this.ui._playerUI.getControlByName("ability_" + digit + "_cooldown");
                let ability = this.getAbilityByDigit(digit) as Ability;
                if (ability) {
                    this.ability_in_cooldown[digit] -= delta;
                    let percentage = ((this.ability_in_cooldown[digit] / ability.cooldown) * 100) / 100;
                    cooldownUI.height = percentage;
                }
            }
        });

        if (!this.isDeadUI && this.health < 1) {
            this.ui._RessurectBox.open();
            this.cameraController.bw(true);
            this.isDeadUI = true;
        }

        if (this.isDeadUI && this.health > 0) {
            this.cameraController.bw(false);
            this.ui._RessurectBox.close();
            this.isDeadUI = false;
        }
    }

    public getAbilityByDigit(digit): Ability | boolean {
        let found = false;
        this.player_data.abilities.forEach((element) => {
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
            this.ui._CastingBar.open();
        }
    }

    // player cancel casting
    public stopCasting(data) {
        this.isCasting = false;
        this.castingElapsed = 0;
        this.castingTarget = 0;
        this.castingDigit = 0;
        this.ui._CastingBar.close();
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // server message handler

    public registerServerMessages() {
        this._room.onMessage(ServerMsg.SERVER_MESSAGE, (data) => {
            this.ui._ChatBox.addNotificationMessage(data.type, data.message, data.message);
        });

        // on teleport confirmation
        this._room.onMessage(ServerMsg.PLAYER_TELEPORT, (location) => {
            console.log(location);
            this.teleport(location);
        });

        // server confirm player can start casting
        this._room.onMessage(ServerMsg.PLAYER_CASTING_START, (data) => {
            this.startCasting(data);
        });

        this._room.onMessage(ServerMsg.PLAYER_CASTING_CANCEL, (data) => {
            this.stopCasting(data);
        });

        // server confirms ability can be cast
        this._room.onMessage(ServerMsg.PLAYER_ABILITY_CAST, (data) => {
            let digit = data.digit;
            let ability = this.getAbilityByDigit(digit) as Ability;
            if (ability) {
                // if you are sender, cancel casting and strat cooldown on client
                if (data.fromId === this.sessionId) {
                    // cancel casting
                    this.castingElapsed = 0;
                    this.castingTarget = 0;
                    this.isCasting = false;
                    this.ui._CastingBar.close();
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

    public async teleport(location) {
        // leave colyseus room
        await this._room.leave();
        await this._game.currentChat.leave();

        // update auth data
        this._game.setLocation(location);

        // switch scene
        this._game.setScene(State.GAME);
    }
}
