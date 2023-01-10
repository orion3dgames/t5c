import { TransformNode, Scene, Vector3, AxesViewer, AbstractMesh, CascadedShadowGenerator, PointerEventTypes} from "@babylonjs/core";
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

export class Entity {
    
    public _scene: Scene;
    public _room;
    public ui;
    public _input;
    public _shadow;
    public _navMesh;
    public assetsContainer;

    // controllers
    public cameraController: PlayerCamera;
    public animatorController: PlayerAnimator;
    public moveController: PlayerMove;
    public utilsController: PlayerUtils;
    public actionsController: PlayerActions;
    public meshController: PlayerMesh;
    
    // entity
    public mesh: AbstractMesh; //outer collisionbox of player
    public playerMesh: AbstractMesh; //outer collisionbox of player
    public characterChatLabel: Rectangle;
    public characterLabel: Rectangle;
    public playerInputs: PlayerInputs[];
    public sessionId: string;
    public entity: PlayerState;
    public isCurrentPlayer:boolean;

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
        navMesh,
        assetsContainer
    ) {
 
        // setup class variables
        this._scene = scene;
        this._room = room;
        this._navMesh = navMesh;
        this.assetsContainer = assetsContainer;
        this.ui = ui;
        this._shadow = shadow;
        this.sessionId = entity.sessionId; // network id from colyseus
        this.entity = entity;
        this._input = input;
        

        // update player data from server data
        Object.assign(this, this.entity);
        
        // spawn player
        this.spawn(entity);
    }

    public async spawn(entity) {

        // load mesh controllers
        this.meshController = new PlayerMesh(this._scene, this.assetsContainer, this.entity, this._room, this.isCurrentPlayer);
        await this.meshController.load();
        this.mesh = this.meshController.mesh;
        this.playerMesh = this.meshController.playerMesh;

        // add mesh to shadow generator
        this._shadow.addShadowCaster(this.meshController.mesh, true);

        // add all player related stuff
        this.animatorController = new PlayerAnimator(this.meshController.getAnimation(), this.entity.type);
        this.moveController = new PlayerMove(this.mesh, this._navMesh, this.isCurrentPlayer);
        this.moveController.setPositionAndRotation(entity); // set next default position from server entity

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

        });

        //////////////////////////////////////////////////////////////////////////
        // player render loop
        this._scene.registerBeforeRender(() => {

            // animate player continuously
            this.animatorController.animate(this, this.mesh.position, this.moveController.getNextPosition());

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

    public registerServerMessages(){

    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // to refactor

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