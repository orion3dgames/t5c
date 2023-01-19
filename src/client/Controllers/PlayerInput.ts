import { Scene } from '@babylonjs/core/scene';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { KeyboardEventTypes } from '@babylonjs/core/Events/keyboardEvents';

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
    public player_can_move: boolean = false;

    // digits
    public digit1: boolean = false;

    // 
    public activate_spell_1: boolean = false;

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
                    this.digit1 = false;
                }
                if (pointerInfo.event.button == 2) {
                    this.right_click = false
                }
                this.player_can_move = false;
            }

            if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
                if (this.left_click) {
                    this.player_can_move = true;
                    const x = (pointerInfo.event.clientX / pointerInfo.event.target.width) * 2 - 1;
                    const y = (pointerInfo.event.clientY / pointerInfo.event.target.height) * 2 - 1;
                    this.inputMap = { rotY: Math.atan2(x, y) }
                    this._updateFromMouse(pointerInfo);
                }
            }
        });

        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
              case KeyboardEventTypes.KEYDOWN:
                if(kbInfo.event.code === 'Digit1'){
                    this.digit1 = true;
                }
                break;
            }
        });

        scene.registerAfterRender(() => {
            /*
            document.documentElement.style.cursor = "default";
            scene.hoverCursor = "default";
            if (this.digit1 === true) {
                document.documentElement.style.cursor = " url('/images/Magic.cur') 12 12, auto ";
                scene.hoverCursor = " url('/images/Magic.cur') 12 12, auto ";
            }*/  
        }) 
    }

    //handles what is done when mouse is pressed or moved
    private _updateFromMouse(pointerInfo): void {

        if (pointerInfo._pickInfo.pickedMesh && 
            pointerInfo._pickInfo.pickedMesh.metadata && 
            pointerInfo._pickInfo.pickedMesh.metadata !== null && 
            pointerInfo._pickInfo.pickedMesh.metadata.type && 
            pointerInfo._pickInfo.pickedMesh.metadata.type === 'entity'){

            this.player_can_move = false;
        }

        //forward - backwards movement
        if (this.inputMap["rotY"] !== null) {
            this.vertical = -Math.cos(this.inputMap["rotY"] + Math.PI / 4);
            this.horizontal = Math.sin(this.inputMap["rotY"] + Math.PI / 4);
        }
    }
}