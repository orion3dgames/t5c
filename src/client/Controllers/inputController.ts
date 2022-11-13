import { Scene, ActionManager, ExecuteCodeAction, Observer, Scalar, PointerEventTypes } from '@babylonjs/core';
import { Hud } from './ui';

export class PlayerInput {

    public inputMap: {};
    private _scene: Scene;

    //simple movement
    public horizontal: number = 0;
    public vertical: number = 0;
    public sequence: number = 0;

    //jumping and dashing
    public jumpKeyDown: boolean = false;
    public dashing: boolean = false;

    // moving
    public moving: boolean;

    constructor(scene: Scene) {

        this._scene = scene;

        // detect mouse movement
        this._scene.onPointerObservable.add((pointerInfo) => {

            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                if (pointerInfo.event.button == 0) {
                    this.sequence = 0;
                    this.moving = true
                }
            }

            if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                if (pointerInfo.event.button == 0) {
                    this.sequence = 0;
                    this.moving = false;
                    this.inputMap = { rotY: null }
                    this.vertical = 0;
                    this.horizontal = 0;
                }
            }

            if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
                if (this.moving) {
                    this.sequence += 1;
                    const x = (pointerInfo.event.x / pointerInfo.event.target.width) * 2 - 1;
                    const y = (pointerInfo.event.y / pointerInfo.event.target.height) * 2 - 1;
                    this.inputMap = { rotY: Math.atan2(x, y) }
                    this._updateFromMouse();
                }
            }
        });


    }

    //handles what is done when mouse is pressed or moved
    private _updateFromMouse(): void {

        //forward - backwards movement
        if (this.inputMap["rotY"]) {
            this.vertical = -Math.cos(this.inputMap["rotY"]);
            this.horizontal = Math.sin(this.inputMap["rotY"]);
        }
    }
}