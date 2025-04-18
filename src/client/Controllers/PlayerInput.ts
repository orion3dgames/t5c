import { Scene } from "@babylonjs/core/scene";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import { GameController } from "./GameController";
import { UserInterface } from "./UserInterface";
import { GameScene } from "../Screens/GameScene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ServerMsg } from "../../shared/types";

export class PlayerInput {
    private _gameScene: GameScene;
    private _scene: Scene;
    private _game: GameController;
    private _room;
    private _ui: UserInterface;

    //simple movement
    public angle: number = 0;
    public horizontal: number = 0;
    public vertical: number = 0;

    // keyboard
    public top_arrow: boolean = false;
    public down_arrow: boolean = false;
    public left_arrow: boolean = false;
    public right_arrow: boolean = false;

    // moving
    public left_click: boolean;
    public right_click: boolean;
    public middle_click: boolean;
    public mouse_moving: boolean = false;
    public left_alt_pressed: boolean = false;
    public keyboard_c: boolean = false;

    // moving
    public player_can_move: boolean = false;

    // digits
    public digit_pressed: number = 0;

    public movementX: number = 0;
    public movementY: number = 0;

    // timers
    public movementTimer;
    public movementTimerNow: number = 0;
    public movementTimerDelay: number = 200;

    constructor(gameScene: GameScene) {
        this._gameScene = gameScene;
        this._game = gameScene._game;
        this._scene = gameScene._scene;
        this._room = this._game.currentRoom;
        this._ui = gameScene._ui;

        // detect mouse movement
        this._scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                // left click
                if (pointerInfo.event.button == 0) {
                    this.left_click = true;
                    this.startMovementTimer();
                }

                // middle click
                if (pointerInfo.event.button == 1) {
                    this.middle_click = true;
                }

                // right click
                if (pointerInfo.event.button == 2) {
                    this.right_click = true;
                }
            }

            if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                // left click
                if (pointerInfo.event.button == 0) {
                    this.left_click = false;
                    this.angle = 0;
                    this.vertical = 0;
                    this.horizontal = 0;
                    this.player_can_move = false;

                    if (this.movementTimer) {
                        this.movementTimerNow = 0;
                        clearInterval(this.movementTimer);
                    }
                }

                // middle click
                if (pointerInfo.event.button == 1) {
                    this.middle_click = false;
                }

                // right click
                if (pointerInfo.event.button == 2) {
                    this.right_click = false;
                }

                this.mouse_moving = false;
            }

            // if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
            if (this.left_click) {
                // this.player_can_move = true;
                let dpi = window.devicePixelRatio;
                const x = ((pointerInfo.event.clientX * dpi) / pointerInfo.event.target.width) * 2 - 1;
                const y = ((pointerInfo.event.clientY * dpi) / pointerInfo.event.target.height) * 2 - 1;
                this.angle = Math.atan2(x, y);
                this.calculateVelocityForces();
            }

            if (this.right_click) {
                this.mouse_moving = true;
            }

            if (this.middle_click) {
                this.movementX = pointerInfo.event.movementX / 100;
                this.movementY = pointerInfo.event.movementY / 75;
            }
            // }
        });

        this._scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    // on press enter, let's focus chatbox input
                    // note: this a debatable one, must monitor
                    if (kbInfo.event.code === "Enter") {
                        this._ui._ChatBox.chatInput.focus();
                    }

                    console.log(kbInfo.event.code);

                    // hotbar
                    if (kbInfo.event.code === "Digit1") {
                        this.digit_pressed = 1;
                    }
                    if (kbInfo.event.code === "Digit2") {
                        this.digit_pressed = 2;
                    }
                    if (kbInfo.event.code === "Digit3") {
                        this.digit_pressed = 3;
                    }
                    if (kbInfo.event.code === "Digit4") {
                        this.digit_pressed = 4;
                    }
                    if (kbInfo.event.code === "Digit5") {
                        this.digit_pressed = 5;
                    }
                    if (kbInfo.event.code === "Digit6") {
                        this.digit_pressed = 6;
                    }
                    if (kbInfo.event.code === "Digit7") {
                        this.digit_pressed = 7;
                    }
                    if (kbInfo.event.code === "Digit8") {
                        this.digit_pressed = 8;
                    }
                    if (kbInfo.event.code === "Digit9") {
                        this.digit_pressed = 9;
                    }

                    // characters
                    if (kbInfo.event.code === "KeyJ") {
                        this._game.sendMessage(ServerMsg.DEBUG_REMOVE_ENTITIES);
                    }
                    if (kbInfo.event.code === "NumpadAdd") {
                        this._game.sendMessage(ServerMsg.DEBUG_INCREASE_ENTITIES);
                    }
                    if (kbInfo.event.code === "NumpadSubtract") {
                        this._game.sendMessage(ServerMsg.DEBUG_DECREASE_ENTITIES);
                    }
                    if (kbInfo.event.code === "NumpadEnter") {
                        this._game.sendMessage(ServerMsg.DEBUG_BOTS);
                    }
                    if (kbInfo.event.code === "Home") {
                        this._ui._MainMenu.takeScreenshot();
                    }
                    if (kbInfo.event.code === "KeyN") {
                        this._gameScene._navMeshDebug.isVisible = !this._gameScene._navMeshDebug.isVisible;
                    }
                    if (kbInfo.event.code === "KeyD") {
                        this._ui._DebugBox._debugPanel.isVisible = !this._ui._DebugBox._debugPanel.isVisible;
                    }
                    if (kbInfo.event.code === "KeyH") {
                        let assetKey = "ENV_" + this._game.currentLocationKey;
                        let allMeshes = this._game._loadedAssets[assetKey];
                        if (allMeshes.loadedMeshes) {
                            let isVisible = !allMeshes.loadedMeshes[0].isVisible;
                            allMeshes.loadedMeshes.forEach((m: Mesh) => {
                                m.isVisible = isVisible;
                            });
                        }
                    }

                    // show items toggle
                    if (kbInfo.event.code === "ControlLeft") {
                        this.left_alt_pressed = true;
                    }

                    break;

                case KeyboardEventTypes.KEYUP:
                    if (
                        kbInfo.event.code === "ArrowUp" ||
                        kbInfo.event.code === "ArrowLeft" ||
                        kbInfo.event.code === "ArrowRight" ||
                        kbInfo.event.code === "ArrowDown"
                    ) {
                        this.player_can_move = false;
                        this.vertical = 0;
                        this.horizontal = 0;
                        this.angle = 0;
                    }

                    // characters
                    if (kbInfo.event.code === "KeyC") {
                        this.keyboard_c = false;
                    }

                    if (kbInfo.event.code === "ControlLeft") {
                        this.left_alt_pressed = false;
                    }
                    break;
            }
        });
    }

    private startMovementTimer() {
        let amount = 100;
        this.movementTimer = setInterval(() => {
            this.movementTimerNow += amount;
            if (this.movementTimerNow >= this.movementTimerDelay) {
                this.player_can_move = true;
                this.movementTimerNow = 0;
                clearInterval(this.movementTimer);
            }
        }, 100);
    }

    private calculateVelocityForces() {
        if (this.angle !== 0) {
            this.vertical = -Math.cos(this.angle + Math.PI - this._game.deltaCamY);
            this.horizontal = Math.sin(this.angle + Math.PI - this._game.deltaCamY);
        }
    }
}
