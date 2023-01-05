import { TransformNode, Scene, Vector3, AbstractMesh, CascadedShadowGenerator, PointerEventTypes} from "@babylonjs/core";
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
import State from "../../client/Screens/Screens";
import { Room } from "colyseus.js";
import { NavMesh, GameEntity} from "yuka";

export class Player {
    
    public _scene: Scene;
    public _room;
    public ui;
    private _input;
    private _shadow;
    private _navMesh:NavMesh;

    // controllers
    public cameraController: PlayerCamera;
    public animatorController: PlayerAnimator;
    public moveController: PlayerMove;
    public utilsController: PlayerUtils;
    public actionsController: PlayerActions;
    public meshController: PlayerMesh;
    
    //Player
    public mesh: AbstractMesh; //outer collisionbox of player
    public playerMesh: AbstractMesh; //outer collisionbox of player
    public characterChatLabel: Rectangle;
    public characterLabel: Rectangle;
    public playerInputs: PlayerInputs[];
    private isCurrentPlayer: boolean;
    public sessionId: string;
    public entity: PlayerState;
    public yuka;

    // character
    public name: string = "";
    public x: number;
    public y: number;
    public z: number;
    public rot: number;
    public health: number;
    public level: number;
    public experience: number;
    public location: string = "";
    public state: number = 0;

    // flags
    public blocked: boolean = false; // if true, player will not moved

    constructor(
        entity:PlayerState,
        room:Room, 
        scene: Scene, 
        ui,
        input, 
        shadow:CascadedShadowGenerator, 
        navMesh:NavMesh
    ) {
 
        // setup class variables
        this._scene = scene;
        this._room = room;
        this._navMesh = navMesh;
        this.ui = ui;
        this._shadow = shadow;
        this.sessionId = entity.sessionId; // network id from colyseus
        this.entity = entity;
        this.isCurrentPlayer = this._room.sessionId === entity.sessionId;
        this._input = input;
        this.playerInputs = [];

        // update player data from server data
        Object.assign(this, this.entity);

        // spawn player
        this.spawn(entity);
    }

    private async spawn(entity) {

        // load mesh controllers
        this.meshController = new PlayerMesh(this._scene, this.entity, this._room, this.isCurrentPlayer);
        await this.meshController.load();
        this.mesh = this.meshController.mesh;
        this.playerMesh = this.meshController.playerMesh;

        // add mesh to shadow generator
        this._shadow.addShadowCaster(this.meshController.mesh, true);

        // if myself, add all player related stuff
        if (this.isCurrentPlayer) {
            this.utilsController = new PlayerUtils(this._scene, this._room);
            this.cameraController = new PlayerCamera(this._scene, this._input);
            this.actionsController = new PlayerActions(this._scene);
        }
        this.animatorController = new PlayerAnimator(this.meshController.getAnimation());
        this.moveController = new PlayerMove(this.mesh, this._navMesh, this.isCurrentPlayer);
        this.moveController.setPositionAndRotation(entity); // set next default position from server entity

        /*
        // ADD YUKA
        this.yuka = new GameEntity()
        this.yuka.setRenderComponent(this.mesh, function(test){
            console.log(test);
        });*/

        ///////////////////////////////////////////////////////////
        // entity network event
        // colyseus automatically sends entity updates, so let's listen to those changes
        this.entity.onChange(() => {

            // make sure players are always visible
            this.playerMesh.visibility = 1;

            // update player data from server data
            Object.assign(this, this.entity);

            // update player position
            this.moveController.setPositionAndRotation(this.entity);

            // do server reconciliation on client if current player only & not blocked
            if (this.isCurrentPlayer && !this.blocked) {
                this.moveController.reconcileMove(this.entity.sequence); // set default entity position
            }
            
        });

        //////////////////////////////////////////////////////////////////////////
        // player register event
        if(this.isCurrentPlayer){

            // register serevr messages
            this.registerServerMessages();

            // mouse events
            this._scene.onPointerObservable.add((pointerInfo:any) => {
            
                // on left mouse click
                // if other player, send to server: target loses 5 health
                if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 0) {
                    /*
                    if (pointerInfo._pickInfo.pickedMesh && 
                        pointerInfo._pickInfo.pickedMesh.metadata !== null && 
                        pointerInfo._pickInfo.pickedMesh.metadata.type == 'player' && 
                        pointerInfo._pickInfo.pickedMesh.metadata.sessionId !== this.sessionId){
                          
                        let targetSessionId = pointerInfo._pickInfo.pickedMesh.metadata.sessionId;    
                        this._room.send("playerAction", {
                            type: 'attack',
                            senderId: this.sessionId,
                            targetId: targetSessionId
                        });

                        // send bullet locally
                        let start = this.mesh.position;
                        let end = pointerInfo._pickInfo.pickedMesh.position;
                        this.actionsController.fire(start, end, this.ui._players[targetSessionId].mesh);
                    }
                    */
                }

                // on right mouse click
                // display nameplate for a certain time for any entity right clicked
                if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 2) {
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
                            }, 5000)
                    }
                }

            });
        }

        //////////////////////////////////////////////////////////////////////////
        // player render loop
        this._scene.registerBeforeRender(() => {

            // animate player continuously
            this.animatorController.animate(this, this.mesh.position, this.moveController.getNextPosition());

            if (this.isCurrentPlayer) {

                // mova camera as player moves
                this.cameraController.follow(this.mesh.position);
            }    
        });

        //////////////////////////////////////////////////////////////////////////
        // misc
        this.characterLabel = this.createLabel(entity.name);
        this.characterChatLabel = this.createChatLabel(entity.name);
      
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // server message handler

    private registerServerMessages(){

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