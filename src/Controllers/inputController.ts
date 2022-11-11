import { Scene, ActionManager, ExecuteCodeAction, Observer, Scalar, PointerEventTypes } from '@babylonjs/core';
import { Hud } from './ui';

export class PlayerInput {

    public inputMap: {};
    private _scene: Scene;

    //simple movement
    public horizontal: number = 0;
    public vertical: number = 0;

    //tracks whether or not there is movement in that axis
    public horizontalAxis: number = 0;
    public verticalAxis: number = 0;

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
                    this.moving = true
                }
            }

            if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                if (pointerInfo.event.button == 0) {
                    this.moving = false;
                    this.inputMap["Right"] = false;
                    this.inputMap["Left"] = false;
                    this.inputMap["Up"] = false;
                    this.inputMap["Down"] = false;
                    this.verticalAxis = 0;
                    this.vertical = 0;
                    this.horizontal = 0;
                    this.horizontalAxis = 0;
                }
            }

            if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
                if (this.moving) {
                    this.inputMap = {};
                    const x = (pointerInfo.event.x / pointerInfo.event.target.width) * 2 - 1;
                    const y = (pointerInfo.event.y / pointerInfo.event.target.height) * 2 - 1;
                    const a = (Math.atan2(x, y) / (2 * Math.PI) * 360);
                    if (a < -157.5) {
                        this.inputMap["Up"] = true;
                    }
                    else if (a < -112.5) {
                        this.inputMap["Up"] = true;
                        this.inputMap["Left"] = true;
                    }
                    else if (a < -67.5) {
                        this.inputMap["Left"] = true;
                    }
                    else if (a < -22.5) {
                        this.inputMap["Left"] = true;
                        this.inputMap["Down"] = true;
                    }
                    else if (a < 22.5) {
                        this.inputMap["Down"] = true;
                    }
                    else if (a < 67.5) {
                        this.inputMap["Down"] = true;
                        this.inputMap["Right"] = true;
                    }
                    else if (a < 112.5) {
                        this.inputMap["Right"] = true;
                    }
                    else if (a < 157.5) {
                        this.inputMap["Right"] = true;
                        this.inputMap["Up"] = true;
                    }
                    else {
                        this.inputMap["Up"] = true;
                    }

                    //console.log(this.inputMap, this.verticalAxis, this.vertical, this.horizontal, this.horizontalAxis);

                    this._updateFromMouse();
                }
            }
        });


    }

    //handles what is done when mouse is pressed or moved
    private _updateFromMouse(): void {

        //lerp will create a scalar linearly interpolated amt between start and end scalar
        //taking current horizontal and how long you hold, will go up to -1(all the way left)

        const d = 1 / Math.sqrt(2);
        //forward - backwards movement
        if (this.inputMap["Up"] && this.inputMap["Left"]) {
            this.vertical = Scalar.Lerp(this.vertical, d, 0.2);
            this.verticalAxis = 1;
            this.horizontal = Scalar.Lerp(this.horizontal, -d, 0.2);
            this.horizontalAxis = -1;
        }
        else if (this.inputMap["Up"] && this.inputMap["Right"]) {
            this.vertical = Scalar.Lerp(this.vertical, d, 0.2);
            this.verticalAxis = 1;
            this.horizontal = Scalar.Lerp(this.horizontal, d, 0.2);
            this.horizontalAxis = 1;
        }
        else if (this.inputMap["Down"] && this.inputMap["Left"]) {
            this.vertical = Scalar.Lerp(this.vertical, -d, 0.2);
            this.verticalAxis = -1;
            this.horizontal = Scalar.Lerp(this.horizontal, -d, 0.2);
            this.horizontalAxis = -1;
        }
        else if (this.inputMap["Down"] && this.inputMap["Right"]) {
            this.vertical = Scalar.Lerp(this.vertical, -d, 0.2);
            this.verticalAxis = -1;
            this.horizontal = Scalar.Lerp(this.horizontal, d, 0.2);
            this.horizontalAxis = 1;
        }
        else if (this.inputMap["Up"]) {
            this.vertical = Scalar.Lerp(this.vertical, 1, 0.2);
            this.verticalAxis = 1;
            this.horizontal = 0;
            this.horizontalAxis = 0;
        } else if ((this.inputMap["Down"])) {
            this.vertical = Scalar.Lerp(this.vertical, -1, 0.2);
            this.verticalAxis = -1;
            this.horizontal = 0;
            this.horizontalAxis = 0;
        }
        else if ((this.inputMap["Left"])) {
            this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.2);
            this.horizontalAxis = -1;
            this.vertical = 0;
            this.verticalAxis = 0;
        } else if ((this.inputMap["Right"])) {
            this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.2);
            this.horizontalAxis = 1;
            this.vertical = 0;
            this.verticalAxis = 0;
        }


    }

}