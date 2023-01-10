import { Scene, Vector3, MeshBuilder, AbstractMesh, CascadedShadowGenerator, PointerEventTypes, StandardMaterial, Texture} from "@babylonjs/core";
import { Control, Rectangle, TextBlock, TextWrapping } from "@babylonjs/gui";
import { PlayerState } from "../../server/rooms/schema/PlayerState";

import Config from "../Config";
import { PlayerInputs } from "../types";
import { PlayerCamera } from "./Player/PlayerCamera";
import { PlayerAnimator } from "./Player/PlayerAnimator";
import { PlayerMove } from "./Player/PlayerMove";
import { PlayerUtils } from "./Player/PlayerUtils";
import { PlayerActions } from "./Player/PlayerActions";
import { PlayerMesh } from "./Player/PlayerMesh";
import { Entity } from "./Entity";
import State from "../../client/Screens/Screens";
import { Room } from "colyseus.js";
import { NavMesh } from "yuka";

export class Player extends Entity {

    constructor(
        entity:PlayerState,
        room:Room, 
        scene: Scene, 
        ui,
        input, 
        shadow:CascadedShadowGenerator, 
        navMesh:NavMesh,
        assetsContainer
    ) {
        super(entity,room, scene, ui, input, shadow, navMesh, assetsContainer);
        this.playerInputs = [];

        this.spawnPlayer()
    }

    private async spawnPlayer() {

        //spawn 
        this.utilsController = new PlayerUtils(this._scene, this._room);
        this.cameraController = new PlayerCamera(this._scene, this._input);
        this.actionsController = new PlayerActions(this._scene);
       
        ///////////////////////////////////////////////////////////
        // entity network event
        // colyseus automatically sends entity updates, so let's listen to those changes
        this.entity.onChange(() => {

            // do server reconciliation on client if current player only & not blocked
            if (this.isCurrentPlayer && !this.blocked) {
                this.moveController.reconcileMove(this.entity.sequence); // set default entity position
            }
            
        });

        //////////////////////////////////////////////////////////////////////////
        // player register event

        // register server messages
        this.registerServerMessages();

        // mouse events
        this._scene.onPointerObservable.add((pointerInfo:any) => {
        
            // on left mouse click
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 0) {
    
                console.log(pointerInfo._pickInfo);

                /////////////////////////////////////////////////////////////////////
                // if click on entity
                if (pointerInfo._pickInfo.pickedMesh && 
                    pointerInfo._pickInfo.pickedMesh.metadata && 
                    pointerInfo._pickInfo.pickedMesh.metadata !== null && 
                    pointerInfo._pickInfo.pickedMesh.metadata.type && 
                    pointerInfo._pickInfo.pickedMesh.metadata.type.includes('monster') && 
                    pointerInfo._pickInfo.pickedMesh.metadata.sessionId !== this.sessionId){
                        
                    // get target
                    let targetSessionId = pointerInfo._pickInfo.pickedMesh.metadata.sessionId;   
                    
                    // send to server
                    this._room.send("entity_attack", {
                        senderId: this.sessionId,
                        targetId: targetSessionId
                    });

                    // send bullet locally
                    let start = this.mesh.position;
                    let end = pointerInfo._pickInfo.pickedMesh.position;
                    this.actionsController.fire(start, end, this.ui._entities[targetSessionId].mesh);
                }


            }

            // on right mouse click
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 2) {

                /////////////////////////////////////////////////////////////////////
                // display nameplate for a certain time for any entity right clicked
                if (pointerInfo._pickInfo.pickedMesh && 
                    pointerInfo._pickInfo.pickedMesh.metadata !== null ){
                        let targetMesh = pointerInfo._pickInfo.pickedMesh;
                        let targetData = targetMesh.metadata;  
                        let target = this.ui._entities[targetData.sessionId];
                        if(targetData.type === 'player'){
                            target = this.ui._players[targetData.sessionId];
                        }
                        target.characterLabel.isVisible = true;
                        setTimeout(function(){
                            target.characterLabel.isVisible = false;
                        }, Config.PLAYER_NAMEPLATE_TIMEOUT)
                }
            }

        });

        //////////////////////////////////////////////////////////////////////////
        // player render loop
        this._scene.registerBeforeRender(() => {

            // mova camera as player moves
            this.cameraController.follow(this.mesh.position);
            
        });
      
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // server message handler

    public registerServerMessages(){

        // on teleport confirmation
        this._room.onMessage('playerTeleportConfirm', (location) => {
            this.actionsController.teleport(this._room, location);
        });

        // on player action
        this._room.onMessage('playerActionConfirmation', (data) => {
            console.log('playerActionConfirmation', data);
            
            switch(data.action){
                case 'atack':
                    this.actionsController.attack(data, this.mesh, this.ui);
                    break;
            }
            
        });

    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // to refactor

    public async teleport(location){
        await this._room.leave();
        global.T5C.currentLocation = Config.locations[location];
        global.T5C.currentLocationKey = location;
        global.T5C.currentCharacter.location = location;
        global.T5C.currentRoomID = "";
        global.T5C.nextScene = State.GAME;
    }

    public createChatLabel(text) {

        var rect1 = new Rectangle('player_chat_'+this.sessionId);
        rect1.isVisible = false;
        rect1.width = "100px";
        rect1.adaptHeightToChildren = true;
        rect1.thickness = 1;
        rect1.cornerRadius = 5;
        rect1.background = "rgba(0,0,0,.5)";
        rect1.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.ui._playerUI.addControl(rect1);
        rect1.linkWithMesh(this.mesh);
        rect1.linkOffsetY = -130;

        var label = new TextBlock('player_chat_label_'+this.sessionId);
        label.text = text;
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
    public createLabel(text) {
        var rect1 = new Rectangle('player_nameplate_'+this.sessionId);
        rect1.isVisible = false;
        rect1.width = "200px";
        rect1.height = "40px";
        rect1.thickness = 0;
        this.ui._playerUI.addControl(rect1);
        rect1.linkWithMesh(this.mesh);
        rect1.linkOffsetY = -100;
        var label = new TextBlock('player_nameplate_text_'+this.sessionId);
        label.text = text;
        label.color = "blue";
        label.fontWeight = "bold";
        rect1.addControl(label);
        return rect1;
    }


    public removePlayer() {
       this.characterLabel.dispose();
       this.characterChatLabel.dispose();
       this.mesh.dispose();
    }
}