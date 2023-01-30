
import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color3 } from "@babylonjs/core/Maths/math.color";

import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";

import { 
    UI_Chats, 
    UI_Abilities, 
    UI_Debug, 
    UI_EntitySelected, 
    UI_Panel
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
    private _namesUI;
    private _UIChat:UI_Chats; 
    private _UIAbilities:UI_Abilities; 
    private _UIDebug:UI_Debug;
    private _UITargetSelected:UI_EntitySelected; 
    private _UIPlayerSelected:UI_EntitySelected;
    private _UIPanel:UI_Panel;

    constructor(scene: Scene, engine:Engine, gameRoom:Room, chatRoom:Room, entities:Entity[], currentPlayer) {

        // set var we will be needing
        this._scene = scene;
        this._engine = engine;
        this._gameRoom = gameRoom;
        this._chatRoom = chatRoom;
        this._entities = entities;
        this._currentPlayer = currentPlayer;
 
        // create ui
        const _namesUI = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene);
        this._namesUI = _namesUI;
        this._namesUI.idealHeight = 720;

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

        // create panel
        this._UIPanel = new UI_Panel(this._playerUI, this._scene, currentPlayer);
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

        const panelStack = new StackPanel("panelStack");
        panelStack.left = "15px";
        panelStack.top = "-15px";
        panelStack.width = "100px";
        panelStack.height = "200px";
        panelStack.background = "rgba(0,0,0,.2)";
        panelStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        panelStack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._playerUI.addControl(panelStack);

  
        const inventoryButton = Button.CreateSimpleButton("inventoryButton", "Inventory");
        inventoryButton.width = "100px;";
        inventoryButton.height = "30px";
        inventoryButton.color = "white";
        inventoryButton.background = "#000"; 
        inventoryButton.thickness = 1;
        inventoryButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        inventoryButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panelStack.addControl(inventoryButton);
        inventoryButton.onPointerDownObservable.add(() => { 
            this._UIPanel.open("inventory");
        });

        // add a quit button
        const quitButton = Button.CreateSimpleButton("quitButton", "Quit");;
        quitButton.width = "100px;";
        quitButton.height = "30px";
        quitButton.color = "white";
        quitButton.background = "#000"; 
        quitButton.thickness = 1;
        quitButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        quitButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panelStack.addControl(quitButton);

        quitButton.onPointerDownObservable.add(() => { 
            this._gameRoom.leave();
            Config.goToScene(State.CHARACTER_SELECTION);
        });

    }

    public createEntityChatLabel(entity) {

        var rect1 = new Rectangle('player_chat_'+entity.sessionId);
        rect1.isVisible = false;
        rect1.width = "100px";
        rect1.adaptHeightToChildren = true;
        rect1.thickness = 1;
        rect1.cornerRadius = 5;
        rect1.background = "rgba(0,0,0,.5)";
        rect1.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._namesUI.addControl(rect1);
        rect1.linkWithMesh(entity.mesh);
        rect1.linkOffsetY = -130;

        var label = new TextBlock('player_chat_label_'+entity.sessionId);
        label.text = entity.name;
        label.color = "white";
        label.paddingLeft = '5px;';
        label.paddingTop = '5px';
        label.paddingBottom = '5px';
        label.paddingRight = '5px';
        label.textWrapping = TextWrapping.WordWrap;
        label.resizeToFit = true; 
        rect1.addControl(label);

        return rect1;
    }

    // obsolete, keeping just in case
    public createEntityLabel(entity) {
        var rect1 = new Rectangle('player_nameplate_'+entity.sessionId);
        rect1.isVisible = true;
        rect1.width = "200px";
        rect1.height = "40px";
        rect1.thickness = 0;
        rect1.zIndex = 
        this._namesUI.addControl(rect1);
        rect1.linkWithMesh(entity.mesh);
        rect1.linkOffsetY = -100;
        var label = new TextBlock('player_nameplate_text_'+entity.sessionId);
        label.text = entity.name;
        label.color = "blue";
        label.fontWeight = "bold";
        rect1.addControl(label);
        return rect1;
    }

}