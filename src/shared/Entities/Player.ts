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
import Locations from "../Data/Locations";
import { Abilities } from "../Data/Abilities";
import { setInterval } from "timers/promises";

export class Player extends Entity {

    public input;
    public interval;

    public isCasting: boolean = false;
    public castingTimer;
    public castingElapsed: number = 0;
    public castingTarget: number = 0;

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
                    pointerInfo._pickInfo.pickedMesh.metadata.race){

                    let metadata = pointerInfo._pickInfo.pickedMesh.metadata;
                    let targetSessionId = metadata.sessionId;
                    let target = this.ui._entities[targetSessionId];

                    if(metadata.type === 'player' && targetSessionId === this.sessionId){
                        target = this.ui._currentPlayer;
                    }
        
                    global.T5C.selectedEntity = target;
                }
            }

            // on right mouse click
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 2) {

                /////////////////////////////////////////////////////////////////////
                // display nameplate for a certain time for any entity right clicked
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
        // player before render loop
        this._scene.registerBeforeRender(() => {

            // move camera as player moves
            this.cameraController.follow(this.mesh.position);

        });

        //////////////////////////////////////////////////////////////////////////
        // player after render loop
        /*
        let isCasting = true;
        let castingElapsed;
        let timeThen = Date.now();
        this._scene.registerAfterRender(() => {

            // every 100ms loop
            let timeNow = Date.now();
            let timePassed = (timeNow - timeThen) / 1000;
            let updateRate = Config.updateRate / 1000; // game is networked update every 100ms
            if (timePassed >= updateRate) { 

                
                timeThen = timeNow;
            }

            // detect input
            if(this._input.digit_pressed > 0){

                let digit = this._input.digit_pressed;
                let ability = this.getAbilityFromDigit(digit);
                let entity = global.T5C.selectedEntity;
           
                // check if castime needed
                if(ability.castTime > 0){

                    let timer = setTimeout(()=>{

                        this._room.send("entity_ability", {
                            senderId: this._room.sessionId,
                            targetId: entity ? entity.sessionId : false,
                            digit: digit
                        });

                    }, ability.castTime)
                    
                }else{

                    this._room.send("entity_ability", {
                        senderId: this._room.sessionId,
                        targetId: entity ? entity.sessionId : false,
                        digit: digit
                    });

                }

                this._input.digit_pressed = 0;
            }

        });*/
      
    }

    public update(){

        // tween entity
        if(this && this.moveController){
            this.moveController.tween();
        }
        
        // if casting
        if(this.isCasting){
            this.castingElapsed += Config.updateRate / 1000;
            this.ui._UICastingTimer.text = this.castingElapsed;
            console.log('CASTING.....', this.castingElapsed, this.castingTarget);

            // cast time has elapsed
            if( this.castingElapsed === this.castingTarget || this.castingElapsed > this.castingTarget ){
                console.log('CASTING FINISHED');

                let digit = this._input.digit_pressed;
                let entity = global.T5C.selectedEntity;
                this._room.send("entity_ability", {
                    senderId: this._room.sessionId,
                    targetId: entity ? entity.sessionId : false,
                    digit: digit
                });

                this.castingElapsed = 0;
                this.castingTarget = 0;
                this.isCasting = false;
                this.ui._UICastingTimer.isVisible = false;
                this.ui._UICastingTimer.text = 0;
            }
        }

        // if digit is pressed
        // and not already casting
        if(this._input.digit_pressed > 0 && !this.isCasting ){

            // get all necessary vars
            let digit = this._input.digit_pressed;
            let ability = this.getAbilityFromDigit(digit);
            let entity = global.T5C.selectedEntity;

            console.log('PLAYER PRESSED DIGIT', digit);

            // if user has ability in that digit
            if(ability){

                // if ability must be cast
                if(ability.castTime > 0){

                    // player is casting
                    this.isCasting = true;
                    this.castingElapsed = 0;
                    this.castingTarget = ability.castTime;
                    this.ui._UICastingTimer.isVisible = true;
                    this.ui._UICastingTimer.text = this.castingElapsed;

                    console.log('START CASTING', 0, this.castingTarget);
                    
                // else send straight to server
                }else{

                    console.log('CASTING FINISHED');

                    this._room.send("entity_ability", {
                        senderId: this._room.sessionId,
                        targetId: entity ? entity.sessionId : false,
                        digit: digit
                    });

                }
            }

            // in all cases, clear key press after
            this._input.digit_pressed = 0;

        }

    }

    public getAbilityFromDigit(digit){
        let ability_no = this.raceData.abilities[digit];
        return Abilities[ability_no];
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
        this._room.onMessage('ability_update', (data) => {
            console.log('ability_update', data);
            this.actionsController.process(data);
        });

    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // to refactor

    public async teleport(location){
        await this._room.leave();
        global.T5C.currentLocation = Locations[location];
        global.T5C.currentLocationKey = location;
        global.T5C.currentCharacter.location = location;
        global.T5C.currentRoomID = "";
        global.T5C.nextScene = State.GAME;
    }

}