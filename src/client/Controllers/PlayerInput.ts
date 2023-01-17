import { Scene } from '@babylonjs/core/scene';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';

export class PlayerInput {

    public inputMap: {};
    private _scene: Scene;

    //simple movement
    public horizontal: number = 0;
    public vertical: number = 0;

    // moving
    public left_click: boolean;
    public right_click: boolean;

    // moving 
    public player_moving: boolean;

    constructor(scene: Scene) {

        this._scene = scene;

        // detect mouse movement
        this._scene.onPointerObservable.add((pointerInfo) => {

            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                if (pointerInfo.event.button == 0) {
                    this.left_click = true
                }
                if (pointerInfo.event.button == 2) {
                    this.right_click = true
                }
            }

            if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                if (pointerInfo.event.button == 0) {
                    this.left_click = false;
                    this.inputMap = { rotY: null }
                    this.vertical = 0;
                    this.horizontal = 0;
                }
                if (pointerInfo.event.button == 2) {
                    this.right_click = false
                }
                this.player_moving = false;
            }

            if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
                if (this.left_click) {
                    this.player_moving = true;
                    const x = (pointerInfo.event.clientX / pointerInfo.event.target.width) * 2 - 1;
                    const y = (pointerInfo.event.clientY / pointerInfo.event.target.height) * 2 - 1;
                    this.inputMap = { rotY: Math.atan2(x, y) }
                    this._updateFromMouse();
                }
            }
        });


    }

    //handles what is done when mouse is pressed or moved
    private _updateFromMouse(): void {

        //forward - backwards movement
        if (this.inputMap["rotY"] !== null) {
            this.vertical = -Math.cos(this.inputMap["rotY"] + Math.PI / 4);
            this.horizontal = Math.sin(this.inputMap["rotY"] + Math.PI / 4);
        }
    }
}