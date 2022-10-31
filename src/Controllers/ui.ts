import { TextBlock, StackPanel, AdvancedDynamicTexture, Image, Button, Rectangle, Control, Grid, InputText, ScrollViewer} from "@babylonjs/gui";
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

    //Chat
    public messages = [];

    constructor(scene: Scene, state:State) {

        this._scene = scene;

        this.messages = [
            {
                id: 1,
                message: "HELLO WORLD 1"
            },
            {
                id: 2,
                message: "HELLO WORLD 2"
            },
        ];
 
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene);
        this._playerUI = playerUI;
        this._playerUI.idealHeight = 720;

        // add chat box (contains all messages)
        const chat_box = new ScrollViewer();
        chat_box.width = .5;
        chat_box.height = .2
        chat_box.left = '20px';
        chat_box.top = "-60px";
        chat_box.color = "#FFFFFF";
        chat_box.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        chat_box.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._playerUI.addControl(chat_box);

        // add chat input
        const chat_input = new InputText();
        chat_input.width = .5;
        chat_input.height = '30px;'
        chat_input.left = '20px';
        chat_input.top = "-20px";
        chat_input.color = "#FFFFFF";
        chat_input.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        chat_input.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._playerUI.addControl(chat_input);

        // chatbox on enter event
        chat_input.onKeyboardEventProcessedObservable.add((ev) => { 
            if(ev.key==="Enter" || ev.code==="Enter"){
                console.log('SEND CHAT', chat_input.text);
            }
        });

    }

}