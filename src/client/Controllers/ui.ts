import { TextBlock, AdvancedDynamicTexture, Button, Control, InputText, ScrollViewer } from "@babylonjs/gui";
import { Scene, MeshBuilder } from "@babylonjs/core";

import State from "../Screens/Screens";
import { Room } from "colyseus.js";

export class Hud {
    private _scene: Scene;

    //UI Elements
    private _playerUI;

    //Chat
    public messages = [];

    constructor(scene: Scene, room:Room) {

        this._scene = scene;
 
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene);
        this._playerUI = playerUI;
        this._playerUI.idealHeight = 720;

        ////////////////////////////
        // add a quit button
        const quitButton = Button.CreateSimpleButton("quit", "Quit");;
        quitButton.width = 0.2
        quitButton.height = "40px";
        quitButton.color = "white";
        quitButton.top = "20px"; 
        quitButton.left = "-20px";
        quitButton.background = "#222"; 
        quitButton.thickness = 1;
        quitButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        quitButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._playerUI.addControl(quitButton);

        quitButton.onPointerDownObservable.add(() => { 
            room.leave();
            window.currentRoomID = "";
            window.nextScene = State.LOBBY;
        });

        ////////////////////////////
        // add chat input
        const chat_input = new InputText();
        chat_input.width = .5;
        chat_input.height = '30px;'
        chat_input.left = '20px';
        chat_input.top = "-20px";
        chat_input.color = "#FFF";
        chat_input.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        chat_input.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._playerUI.addControl(chat_input);

        // chatbox on enter event
        chat_input.onKeyboardEventProcessedObservable.add((ev) => { 
            if((ev.key==="Enter" || ev.code==="Enter") && chat_input.text != ""){
                room.send("playerMessage", chat_input.text);
                chat_input.text = "";
                chat_input.focus();
                this._refreshChatBox();
            }
        });

        // receive message event
        room.onMessage("playerMessage", (message) => {
            console.log("playerMessage",message);
           this.messages.push(message); 
           this._refreshChatBox();
        });

        // intial refresh chatbox
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
   
            let date = new Date(msg.createdAt);
            let dateFormat = date.toLocaleString('en-US');

            var roomTxt = new TextBlock();
            roomTxt.paddingLeft = "5px";
            roomTxt.text = dateFormat+" | "+msg.senderID+': '+msg.message;
            roomTxt.textHorizontalAlignment = 0;
            roomTxt.height = "30px";
            roomTxt.fontSize = "12px";
            roomTxt.color = "#000";
            roomTxt.left = .1;
            roomTxt.top = top+"px";
            roomTxt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            roomTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            sv.addControl(roomTxt);

            top += 25;

        });
        
    }

}