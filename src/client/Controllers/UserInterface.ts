import { TextBlock, AdvancedDynamicTexture, Button, Control, InputText, ScrollViewer, Rectangle, TextWrapping, StackPanel } from "@babylonjs/gui";
import { Scene, Engine } from "@babylonjs/core";

import { Room } from "colyseus.js";

import State from "../Screens/Screens";
import { Player } from "../../shared/Entities/Player";
import { countPlayers, roundToTwo } from "../../shared/Utils";
import { PlayerMessage } from "../../shared/types";
import Config from "../../shared/Config";

export class UserInterface {
    
    private _scene: Scene;

    //UI Elements
    private _playerUI;
    private _chatUI; 

    //Chat
    public messages: PlayerMessage[] = [];

    constructor(scene: Scene, engine:Engine, room:Room, chatRoom:Room, players:Player[]) {

        this._scene = scene;
 
        // create main io box
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene);
        this._playerUI = playerUI;
        this._playerUI.idealHeight = 720;

        ////////////////////////////
        // add a quit button
        const quitButton = Button.CreateSimpleButton("quit", "Quit");;
        quitButton.width = 0.2
        quitButton.height = "30px";
        quitButton.color = "white";
        quitButton.top = "20px"; 
        quitButton.left = "-20px";
        quitButton.background = "#000"; 
        quitButton.thickness = 1;
        quitButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        quitButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._playerUI.addControl(quitButton);

        quitButton.onPointerDownObservable.add(() => { 
            room.leave();
            Config.goToScene(State.CHARACTER_SELECTION);
        });

        ////////////////////////////
        // add location debug info
        const locationBtn = new TextBlock("location", "");
        locationBtn.width = 0.5
        locationBtn.height = 0.3;
        locationBtn.color = "#FFF";
        locationBtn.top = "20px"; 
        locationBtn.left = "20px";
        locationBtn.fontSize = "24px;";
        locationBtn.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        locationBtn.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        locationBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        locationBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._playerUI.addControl(locationBtn);


        ////////////////////////////
        // add chat input
        const chat_input = new InputText();
        chat_input.width = .5;
        chat_input.height = '30px;'
        chat_input.left = '20px';
        chat_input.top = "-20px";
        chat_input.color = "#FFF";
        chat_input.placeholderText = "Write message here...";
        chat_input.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        chat_input.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._playerUI.addControl(chat_input);

        // chatbox on enter event
        chat_input.onKeyboardEventProcessedObservable.add((ev) => { 
            if((ev.key==="Enter" || ev.code==="Enter") && chat_input.text != ""){
                chatRoom.send("message", {
                    username: global.T5C.currentCharacter.name,
                    message: chat_input.text
                });
                chat_input.text = "";
                chat_input.focus();
                this._refreshChatBox();
            }
        });

        // receive message event
        chatRoom.onMessage("messages", (message:PlayerMessage) => {
           this.messages.push(message); 
           this._refreshChatBox();
        });

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {
            this._refreshUI(locationBtn, engine, room, players);
        });

        // add default chat message
        this.messages.push({
            senderID: "SYSTEM",
            message: "Welcome to T5C, you can move around by left clicking and dragging the mouse around.",
            username: "SYSTEM",
            timestamp: 0,
            createdAt: ""
        }); 

        // add scrollable container
        var sv = new ScrollViewer("chat-scroll-viewer");
        sv.width = 0.5;
        sv.height = 0.2;
        sv.left = '20px';
        sv.top = "-60px";
        sv.background = "#CCCCCC";
        sv.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        sv.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

        // add stack panel
        const sp = new StackPanel("chat-stack-panel");
        sp.width = "100%";
        sp.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        sp.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        sp.paddingTop = "5px;"
        sv.addControl(sp);

        this._chatUI = sp;
        this._playerUI.addControl(sv);

        // intial refresh chatbox
        this._refreshChatBox();
    }

    // ui refresh
    private _refreshUI(locationBtn, engine, room, players){
        let locationText = "";
        locationText = "Zone: "+(global.T5C.currentLocation.title ?? 'undefined')+"\n";
        locationText += "RoomID: "+room.roomId+" \n";
        locationText += "PlayerID: "+room.sessionId+" \n";
        locationText += "Total Players: "+countPlayers(players)+" \n";
        locationText += "FPS: "+roundToTwo(engine.getFps())+" \n";
        locationText += "Ping: 0.0ms \n";
        locationBtn.text = locationText;
    }

    // chat refresh
    private _refreshChatBox(){

        // remove all chat and refresh
        let elements = this._chatUI.getDescendants();
        elements.forEach(element => {
            element.dispose();
        });

        this.messages.slice().reverse().forEach((msg:PlayerMessage) => {

            // container
            var headlineRect = new Rectangle("chatmessage_"+msg.timestamp);
            headlineRect.width = "100%";
            headlineRect.thickness = 0;
            headlineRect.paddingBottom = "10px";
            headlineRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            headlineRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            headlineRect.adaptHeightToChildren = true;
            this._chatUI.addControl(headlineRect);

            // message
            var roomTxt = new TextBlock();
            roomTxt.paddingLeft = "5px";
            roomTxt.text = "[GLOBAL] "+msg.username+': ' +msg.message;
            roomTxt.textHorizontalAlignment = 0;
            roomTxt.fontSize = "12px";
            roomTxt.color = "#000";
            roomTxt.left = "0px";
            roomTxt.textWrapping = TextWrapping.WordWrap;
            roomTxt.resizeToFit = true;
            roomTxt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            roomTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            headlineRect.addControl(roomTxt);

        });
        
    }

}