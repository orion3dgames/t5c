import { TextBlock, StackPanel, AdvancedDynamicTexture, Image, Button, Rectangle, Control, Grid, InputText, ScrollViewer} from "@babylonjs/gui";
import { Scene, Sound, ParticleSystem, PostProcess, Effect, SceneSerializer } from "@babylonjs/core";

import State from "../Screens/Screens";

import { Room } from "colyseus.js";

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

    constructor(scene: Scene, room:Room) {

        this._scene = scene;
 
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene);
        this._playerUI = playerUI;
        this._playerUI.idealHeight = 720;

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
                room.send("message", chat_input.text);
                chat_input.text = "";
                this._refreshChatBox();
            }
        });

        // receive message event
        room.onMessage("message", (message) => {
            console.log(message);
           this.messages.push(message); 
           this._refreshChatBox();
        });

        this._refreshChatBox();
    }

    private _refreshChatBox(){

        // add scrollable container
        var sv = new ScrollViewer();
        sv.width = 0.5;
        sv.height = 0.2;
        sv.left = '20px';
        sv.top = "-60px";
        sv.background = "#CCCCCC";
        sv.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        sv.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._playerUI.addControl(sv);

        var top = 0;
        this.messages.slice().reverse().forEach(msg => {
   
            var roomTxt = new TextBlock();
            roomTxt.text = msg.senderID+': '+msg.message;
            roomTxt.textHorizontalAlignment = 0;
            roomTxt.height = "30px";
            roomTxt.fontSize = "16px";
            roomTxt.color = "white";
            roomTxt.left = .1;
            roomTxt.top = top+"px";
            roomTxt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            roomTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            sv.addControl(roomTxt);

            top += 25;

        });
        
    }

}