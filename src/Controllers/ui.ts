import { TextBlock, StackPanel, AdvancedDynamicTexture, Image, Button, Rectangle, Control, Grid } from "@babylonjs/gui";
import { Scene, Sound, ParticleSystem, PostProcess, Effect, SceneSerializer } from "@babylonjs/core";

import State from "../Screens/Screens";

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

    constructor(scene: Scene, state:State) {

        this._scene = scene;
 
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
        this._playerUI = playerUI;
        this._playerUI.idealHeight = 720;

    }

}