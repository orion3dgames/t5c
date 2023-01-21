
import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color3 } from "@babylonjs/core/Maths/math.color";

import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { InputText } from "@babylonjs/gui/2D/controls/inputText";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Image } from "@babylonjs/gui/2D/controls/image";

import { UI_Chats } from "./UI/UI_Chats";
import { UI_Abilities } from "./UI/UI_Abilities";

import { Room } from "colyseus.js";
import State from "../Screens/Screens";
import { Entity } from "../../shared/Entities/Entity";
import { countPlayers, roundToTwo } from "../../shared/Utils";
import { PlayerMessage } from "../../shared/types";
import Config from "../../shared/Config";

export class UserInterface {
    
    private _scene: Scene;
    private _engine: Engine;

    private _gameRoom: Room;
    private _chatRoom: Room;
    public _entities:Entity[];
    private _currentPlayer;

    //UI Elements
    private _playerUI;
    private _tooltip; 
    private _debugUI:Rectangle; 

    // NewUI
    private _UIChat:UI_Chats; 
    private _UIAbilities:UI_Abilities; 

    //Chat
    public messages: PlayerMessage[] = [];

    //
    public maxWidth = "600px";
    public uiWidth = "0.5";

    constructor(scene: Scene, engine:Engine, gameRoom:Room, chatRoom:Room, entities:Entity[], currentPlayer) {

        // set var we will be needing
        this._scene = scene;
        this._engine = engine;
        this._gameRoom = gameRoom;
        this._chatRoom = chatRoom;
        this._entities = entities;
        this._currentPlayer = currentPlayer;
 
        // create ui
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene);
        this._playerUI = playerUI;
        this._playerUI.idealHeight = 720;

        // create chat ui + events
        this._UIChat = new UI_Chats(playerUI, chatRoom, currentPlayer, entities);

        // create abilities ui + events
        this._UIAbilities = new UI_Abilities(playerUI);

        /////////////////////////////////////
        // create interface
        //let debugTextUI = this.createDebugPanel();
        this.createMisc();
        this.createSelectedEntityPanel();

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {

            // refresh 
            //this._refreshDebugPanel(debugTextUI);
            this.refreshEntityUI();
            
        });
        
    }

    /**
     * Generate a hexadecimal color from a number between 0-100
     * @param value number between 0 - 100
     * @returns 
     */
    healthColor(value){
        let gHex = Math.round(value * 255 / 100) // rule of three to calibrate [0, 100] to [00, FF] (= [0, 255])
        let rHex = 255 - gHex // just the mirror of gHex
        let gHexString = gHex.toString(16) // converting to traditional hex representation
        let rHexString = rHex.toString(16)
        gHexString = gHexString.length === 1 ? `0${gHex}` : gHexString // compensating missing digit in case of single digit values
        rHexString = rHexString.length === 1 ? `0${rHex}` : rHexString
        return `#${rHexString}${gHexString}00` // composing both in a color code
    }

    public refreshEntityUI(){
        for(let sessionId in this._entities){
            let player = this._entities[sessionId];
            // update player color outline
            let mesh = player.playerMesh.getChildMeshes()[0];
            if(mesh){
                mesh.outlineColor = Color3.FromHexString(this.healthColor(player.health));
            }
        }        
    }

    // set current player
    ////////////////////////////
    public setCurrentPlayer(currentPlayer){
        this._currentPlayer = currentPlayer;
        this._UIChat.setCurrentPlayer(currentPlayer);
        this.createCharacterPanel();
        this.createSelectedEntityPanel();
    }

    // create misc stuff
    ////////////////////////////
    public createMisc(){

        // add a quit button
        const quitButton = Button.CreateSimpleButton("quit", "Quit");;
        quitButton.width = "50px;";
        quitButton.height = "30px";
        quitButton.color = "white";
        quitButton.top = "-15px"; 
        quitButton.left = "15px";
        quitButton.background = "#000"; 
        quitButton.thickness = 1;
        quitButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        quitButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._playerUI.addControl(quitButton);

        quitButton.onPointerDownObservable.add(() => { 
            this._gameRoom.leave();
            Config.goToScene(State.CHARACTER_SELECTION);
        });

    }

    // character panel
    ////////////////////////////
    public createDebugPanel(){
 
        // add stack panel
        const debugPanel = new Rectangle("debugPanel");
        debugPanel.top = "60px;"
        debugPanel.left = "20px;"
        debugPanel.width = "200px;"
        debugPanel.height = .2;
        debugPanel.background = "rgba(0,0,0,.5)";
        debugPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        debugPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._playerUI.addControl(debugPanel);

        const debugText = new TextBlock("debugText");
        debugText.color = "#FFF";
        debugText.top = "5px"; 
        debugText.left = "5px";
        debugText.fontSize = "18px;";
        debugText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        debugText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        debugText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        debugText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        debugPanel.addControl(debugText);
        
        return debugText;
    }

    // debug panel refresh
    private _refreshDebugPanel(debugTextUI){
        let locationText = "";
        locationText = "Zone: "+(global.T5C.currentLocation.title ?? 'undefined')+"\n";
        locationText += "RoomID: "+this._gameRoom.roomId+" \n";
        locationText += "PlayerID: "+this._gameRoom.sessionId+" \n";
        locationText += "Total Players: "+countPlayers(this._entities)+" \n";
        locationText += "FPS: "+roundToTwo(this._engine.getFps())+" \n";
        locationText += "Ping: 0.0ms \n";
        debugTextUI.text = locationText;
    }

    // character panel
    ////////////////////////////
    public createSelectedEntityPanel(){

        const selectedEntityBar = new Rectangle("selectedEntityBar");
        selectedEntityBar.top = "15px;"
        selectedEntityBar.left = "-15px;"
        selectedEntityBar.width = "215px;"
        selectedEntityBar.height = "55px;";
        selectedEntityBar.background = Config.UI_CENTER_PANEL_BG;
        selectedEntityBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        selectedEntityBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        selectedEntityBar.isVisible = false;
        this._playerUI.addControl(selectedEntityBar);

        const playerNameTxt = new TextBlock("playerNameTxt", "");
        playerNameTxt.text = "Nothing selected";
        playerNameTxt.color = "#FFF";
        playerNameTxt.top = "5px"; 
        playerNameTxt.left = "-5px";
        playerNameTxt.fontSize = "16px;";
        playerNameTxt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        playerNameTxt.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        playerNameTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        playerNameTxt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        selectedEntityBar.addControl(playerNameTxt);

        const characterPanel = new Rectangle("healthBar");
        characterPanel.top = "25px;"
        characterPanel.left = "-5px;"
        characterPanel.width = "200px;"
        characterPanel.height = "20px;";
        characterPanel.background = Config.UI_CENTER_PANEL_BG;
        characterPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        characterPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        selectedEntityBar.addControl(characterPanel);
        
        const characterPanelInside = new Rectangle("healthBarInside");
        characterPanelInside.top = "0px;"
        characterPanelInside.left = "0px;"
        characterPanelInside.width = "200px;"
        characterPanelInside.thickness = 0;
        characterPanelInside.height = "20px;";
        characterPanelInside.background = "green";
        characterPanelInside.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        characterPanelInside.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        characterPanel.addControl(characterPanelInside);
        
        const characterText = new TextBlock("healthBarText", "");
        characterText.text = "Health: ";
        characterText.color = "#FFF";
        characterText.top = "2px"; 
        characterText.left = "-5px";
        characterText.fontSize = "16px;";
        characterText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        characterText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        characterText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        characterText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        characterPanelInside.addControl(characterText);

         // some ui must be constantly refreshed as things change
         this._scene.registerBeforeRender(() => {
            selectedEntityBar.isVisible = false;
            if(global.T5C.selectedEntity){
                selectedEntityBar.isVisible = true;
                let entity = global.T5C.selectedEntity;
                playerNameTxt.text = entity.name;
                characterText.text = entity.health;
                characterPanelInside.background = this.healthColor(entity.health);
                characterPanelInside.width = (entity.health * 2)+"px";
            }    
        });
    }

    // character panel
    ////////////////////////////
    public createCharacterPanel(){

        if(!this._currentPlayer) return false

        const selectedEntityBar = new Rectangle("playerCharacterPanel");
        selectedEntityBar.top = "15px;"
        selectedEntityBar.left = "15px;"
        selectedEntityBar.width = "215px;"
        selectedEntityBar.height = "55px;";
        selectedEntityBar.background = Config.UI_CENTER_PANEL_BG;
        selectedEntityBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        selectedEntityBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._playerUI.addControl(selectedEntityBar);

        const playerNameTxt = new TextBlock("playerNameTxt", "");
        playerNameTxt.text = this._currentPlayer.name;
        playerNameTxt.color = "#FFF";
        playerNameTxt.top = "5px"; 
        playerNameTxt.left = "5px";
        playerNameTxt.fontSize = "16px;";
        playerNameTxt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        playerNameTxt.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        playerNameTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        playerNameTxt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        selectedEntityBar.addControl(playerNameTxt);

        const characterPanel = new Rectangle("healthBar");
        characterPanel.top = "25px;"
        characterPanel.left = "5px;"
        characterPanel.width = "200px;"
        characterPanel.height = "20px;";
        characterPanel.background = Config.UI_CENTER_PANEL_BG;
        characterPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        characterPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        selectedEntityBar.addControl(characterPanel);
        
        const characterPanelInside = new Rectangle("healthBarInside");
        characterPanelInside.top = "0px;"
        characterPanelInside.left = "0px;"
        characterPanelInside.width = "200px;"
        characterPanelInside.thickness = 0;
        characterPanelInside.height = "20px;";
        characterPanelInside.background = "green";
        characterPanelInside.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        characterPanelInside.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        characterPanel.addControl(characterPanelInside);
        
        const characterText = new TextBlock("healthBarText", "");
        characterText.text = "Health: ";
        characterText.color = "#FFF";
        characterText.top = "2px"; 
        characterText.left = "-5px";
        characterText.fontSize = "16px;";
        characterText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        characterText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        characterText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        characterText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        characterPanelInside.addControl(characterText);


         // some ui must be constantly refreshed as things change
         this._scene.registerBeforeRender(() => {
            characterText.text = this._currentPlayer.health;
            characterPanelInside.background = this.healthColor(this._currentPlayer.health);
            characterPanelInside.width = (this._currentPlayer.health * 2)+"px";
        });
    }

}