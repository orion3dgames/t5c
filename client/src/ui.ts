import { TextBlock, StackPanel, AdvancedDynamicTexture, Image, Button, Rectangle, Control, Grid } from "@babylonjs/gui";
import { Scene, Sound, ParticleSystem, PostProcess, Effect, SceneSerializer } from "@babylonjs/core";

export class Hud {
    private _scene: Scene;

    //Game Timer
    public time: number; //keep track to signal end game REAL TIME

    //Timer handlers
    public stopSpark: boolean;

    //Pause toggle
    public gamePaused: boolean;

    //Quit game
    public quit: boolean;
    public transition: boolean = false;

    //UI Elements
    public pauseBtn: Button;
    public fadeLevel: number;
    private _playerUI;
    public tutorial;
    public hint;

    //Mobile
    public isMobile: boolean;
    public jumpBtn: Button;
    public dashBtn: Button;
    public leftBtn: Button;
    public rightBtn: Button;
    public upBtn: Button;
    public downBtn: Button;

    //Sounds
    public quitSfx: Sound;

    constructor(scene: Scene) {

        this._scene = scene;
 
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this._playerUI = playerUI;
        this._playerUI.idealHeight = 720;

        const quitButton = Button.CreateSimpleButton("start", "Quit");
        quitButton.fontFamily = "Viga";
        quitButton.width = 0.2
        quitButton.height = "40px";
        quitButton.color = "white";
        quitButton.top = "20px"; 
        quitButton.left = "-20px"; 
        quitButton.thickness = 1;
        quitButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        quitButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._playerUI.addControl(quitButton);

        quitButton.onPointerDownObservable.add(() => { 
            this.transition = true;
        });

    }

}