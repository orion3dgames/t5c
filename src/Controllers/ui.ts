import { TextBlock, StackPanel, AdvancedDynamicTexture, Image, Button, Rectangle, Control, Grid, InputText } from "@babylonjs/gui";
import { Scene, Sound, ParticleSystem, PostProcess, Effect, SceneSerializer } from "@babylonjs/core";

import State from "../Screens/Screens";

export class Hud {
    private _scene: Scene;

    //Game Timer
    public time: number; //keep track to signal end game REAL TIME

    //Pause toggle
    public gamePaused: boolean;

    //UI Elements
    public pauseBtn: Button;
    private _playerUI;

    //Sounds
    public quitSfx: Sound;

    constructor(scene: Scene, state:State) {

        this._scene = scene;
 
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene);
        this._playerUI = playerUI;
        this._playerUI.idealHeight = 720;

        // add chat
        const chatbox = new InputText();
        chatbox.width = .5;
        chatbox.height = '30px;'
        chatbox.left = '20px';
        chatbox.top = "-20px";
        chatbox.color = "#FFFFFF";
        chatbox.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        chatbox.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._playerUI.addControl(chatbox);

        // chatbox on enter event
        chatbox.onKeyboardEventProcessedObservable.add((ev) => { 
            if(ev.key==="Enter" || ev.code==="Enter"){
                console.log('SEND CHAT', chatbox.text);
            }
        });

    }

}