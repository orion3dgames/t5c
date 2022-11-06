import { Scene, ActionManager, ExecuteCodeAction, Observer, Scalar } from '@babylonjs/core';
import { Hud } from './ui';

export class PlayerInput {

    public inputMap: any;
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

        //scene action manager to detect inputs
        this._scene.actionManager = new ActionManager(this._scene);

        this.inputMap = {};
        this._scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        this._scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));

        //add to the scene an observable that calls updateFromKeyboard before rendering
        scene.onBeforeRenderObservable.add(() => {
            this._updateFromKeyboard();
            this._updateFromMouse();
            console.log();
        });

        scene.onPointerDown = function (e){
            if(e.button == 0){
                this.moving=true
            }
        }
	
        scene.onPointerUp = function (e){		
            if(e.button == 0){
                this.moving=false
                this.vertical = 0;
                this.verticalAxis = 0;
                this.horizontal = 0;
                this.horizontalAxis = 0;
            }
        }

        scene.onPointerMove = function (evt){	
            if(this.moving){	
                
                this.vertical = Scalar.Lerp(this.vertical, evt.movementY, 0.2);
                this.horizontal = Scalar.Lerp(this.horizontal, evt.movementX, 0.2);

                let x = evt.x / evt.target.width;
                let y = evt.y / evt.target.height;

                // right
                if(x > 0.5){
                    this.horizontal = 1;
                    this.horizontalAxis = 1;
                // left
                }else{
                    this.horizontal = -1;
                    this.horizontalAxis = -1;
                }

                if(y > 0.5){
                    this.verticalAxis = 1;
                    this.vertical = 1;
                }else{
                    this.vertical = -1;
                    this.verticalAxis = -1;
                }

                console.log(this.horizontalAxis, this.verticalAxis, this.vertical, this.horizontal);
            }
            //this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }

    }

    // Mouse UPDATE
    private _updateFromMouse(): void {

        

    }

    // Keyboard controls & Mobile controls
    //handles what is done when keys are pressed or if on mobile, when buttons are pressed
    private _updateFromKeyboard(): void {

        //forward - backwards movement
        if ((this.inputMap["ArrowUp"])) {
            this.verticalAxis = 1;
            this.vertical = Scalar.Lerp(this.vertical, 1, 0.2);

        } else if ((this.inputMap["ArrowDown"])) {
            this.vertical = Scalar.Lerp(this.vertical, -1, 0.2);
            this.verticalAxis = -1;
        } else {
            this.vertical = 0;
            this.verticalAxis = 0;
        }

        //left - right movement
        if ((this.inputMap["ArrowLeft"])) {
            //lerp will create a scalar linearly interpolated amt between start and end scalar
            //taking current horizontal and how long you hold, will go up to -1(all the way left)
            this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.2);
            this.horizontalAxis = -1;

        } else if ((this.inputMap["ArrowRight"])) {
            this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.2);
            this.horizontalAxis = 1;
        }
        else {
            this.horizontal = 0;
            this.horizontalAxis = 0;
        }

        //dash
        if ((this.inputMap["Shift"])) {
            this.dashing = true;
        } else {
            this.dashing = false;
        }

        //Jump Checks (SPACE)
        if ((this.inputMap[" "])) {
            this.jumpKeyDown = true;
        } else {
            this.jumpKeyDown = false;
        }

        //console.log(this);
    }

}