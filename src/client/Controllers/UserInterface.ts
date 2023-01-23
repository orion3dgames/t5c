
import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color3 } from "@babylonjs/core/Maths/math.color";

import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Control } from "@babylonjs/gui/2D/controls/control";

import { 
    UI_Chats, 
    UI_Abilities, 
    UI_Debug, 
    UI_EntitySelected 
} from "./UI";

import { Room } from "colyseus.js";
import State from "../Screens/Screens";
import { Entity } from "../../shared/Entities/Entity";
import { getHealthColorFromValue } from "../../shared/Utils";
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
    private _UIChat:UI_Chats; 
    private _UIAbilities:UI_Abilities; 
    private _UIDebug:UI_Debug;
    private _UITargetSelected:UI_EntitySelected; 
    private _UIPlayerSelected:UI_EntitySelected;

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

        /////////////////////////////////////
        // create interface
        this.createMisc();

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {

            // refresh 
            //this._refreshDebugPanel(debugTextUI);
            //this.refreshEntityUI();
            
        });
        
    }

    // set current player
    ////////////////////////////
    public setCurrentPlayer(currentPlayer){
        
        // set current player
        this._currentPlayer = currentPlayer;

        // create chat ui + events
        this._UIChat = new UI_Chats(this._playerUI, this._chatRoom, currentPlayer, this._entities);
 
        // create abilities ui + events
        this._UIAbilities = new UI_Abilities(this._playerUI, this._gameRoom, currentPlayer);

        // create debug ui + events
        //this._UIDebug = new UI_Debug(this._playerUI, this._engine, this._scene, this._gameRoom, this._currentPlayer, this._entities);

        // create selected entity panel
        this._UITargetSelected = new UI_EntitySelected(this._playerUI, this._scene, { position: "RIGHT", currentPlayer: false });
        this._UIPlayerSelected = new UI_EntitySelected(this._playerUI, this._scene, { position: "LEFT", currentPlayer: currentPlayer });
    }

    public refreshEntityUI(){
        for(let sessionId in this._entities){
            let player = this._entities[sessionId];
            // update player color outline
            let mesh = player.playerMesh.getChildMeshes()[0];
            if(mesh){
                mesh.outlineColor = Color3.FromHexString(getHealthColorFromValue(player.health));
            }
        }        
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

}