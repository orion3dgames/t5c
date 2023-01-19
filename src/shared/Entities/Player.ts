import { Scene } from "@babylonjs/core/scene";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";

import { EntityState } from "../../server/rooms/schema/EntityState";

import Config from "../Config";
import { EntityCamera } from "./Entity/EntityCamera";
import { EntityUtils } from "./Entity/EntityUtils";
import { EntityActions } from "./Entity/EntityActions";
import { Entity } from "./Entity";
import State from "../../client/Screens/Screens";
import { PlayerInput } from "../../client/Controllers/PlayerInput";
import { UserInterface } from "../../client/Controllers/UserInterface";
import { Room } from "colyseus.js";
import { NavMesh } from "../yuka";

export class Player extends Entity {

    public input;
    public interval;

    constructor(
        entity:EntityState,
        room:Room, 
        scene: Scene, 
        ui:UserInterface,
        shadow:CascadedShadowGenerator, 
        navMesh:NavMesh,
        assetsContainer:AssetContainer[],
        input:PlayerInput
    ) {
        super(entity, room, scene, ui, shadow, navMesh, assetsContainer);

        this._input = input;

        this.spawnPlayer()
    }

    private async spawnPlayer() {

        //spawn 
        this.utilsController = new EntityUtils(this._scene, this._room);
        this.cameraController = new EntityCamera(this._scene, this._input);
        this.actionsController = new EntityActions(this._scene);
       
        ///////////////////////////////////////////////////////////
        // entity network event
        // colyseus automatically sends entity updates, so let's listen to those changes


        //////////////////////////////////////////////////////////////////////////
        // player register event

        // register server messages
        this.registerServerMessages();

        // mouse events
        this._scene.onPointerObservable.add((pointerInfo:any) => {
        
            // on left mouse click
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 0) {
    
                //console.log(pointerInfo._pickInfo);

                /////////////////////////////////////////////////////////////////////
                // if click on entity
                if (pointerInfo._pickInfo.pickedMesh && 
                    pointerInfo._pickInfo.pickedMesh.metadata && 
                    pointerInfo._pickInfo.pickedMesh.metadata !== null && 
                    pointerInfo._pickInfo.pickedMesh.metadata.race && 
                    pointerInfo._pickInfo.pickedMesh.metadata.race.includes('monster') && 
                    pointerInfo._pickInfo.pickedMesh.metadata.sessionId !== this.sessionId){
                        
                    // get target
                    let targetSessionId = pointerInfo._pickInfo.pickedMesh.metadata.sessionId;   
                        
                    if(this._input.left_click === true && this._input.digit1 === true){
                        
                        // send to server
                        this._room.send("entity_attack", {
                            senderId: this.sessionId,
                            targetId: targetSessionId
                        });

                        /*
                        // send bullet locally
                        let start = this.mesh.position;
                        let end = pointerInfo._pickInfo.pickedMesh.position;
                        this.actionsController.fire(start, end, this.ui._entities[targetSessionId].mesh);*/

                    }
                }


            }

            // on right mouse click
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 2) {

                /////////////////////////////////////////////////////////////////////
                // display nameplate for a certain time for any entity right clicked
                console.log('RIGHT CLICK', pointerInfo._pickInfo);
                if (pointerInfo._pickInfo.pickedMesh && 
                    pointerInfo._pickInfo.pickedMesh.metadata && 
                    pointerInfo._pickInfo.pickedMesh.metadata.sessionId && 
                    pointerInfo._pickInfo.pickedMesh.metadata.sessionId != this._room.sessionId
                    ){
                        let targetMesh = pointerInfo._pickInfo.pickedMesh;
                        let targetData = targetMesh.metadata;  
                        let target = this.ui._entities[targetData.sessionId];
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

            // move camera as player moves
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
        this._room.onMessage('player_update', (data) => {
            console.log('player_update', data);
            switch(data.action){
                case 'attack':
                    this.actionsController.attack(data);
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

}