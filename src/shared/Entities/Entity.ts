import { Scene } from "@babylonjs/core/scene";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";

import { EntityState } from "../../server/rooms/schema/EntityState";
import { EntityCamera } from "./Entity/EntityCamera";
import { EntityAnimator } from "./Entity/EntityAnimator";
import { EntityMove } from "./Entity/EntityMove";
import { EntityUtils } from "./Entity/EntityUtils";
import { EntityActions } from "./Entity/EntityActions";
import { EntityMesh } from "./Entity/EntityMesh";
import { Room } from "colyseus.js";
import { UserInterface } from "../../client/Controllers/UserInterface";
import { NavMesh } from "../yuka";
import { AI_STATE } from "./Entity/AIState";
import Config from "../Config";
import Races from "../Data/Races";

export class Entity {
    
    public _scene: Scene;
    public _room;
    public ui;
    public _input;
    public _shadow;
    public _navMesh;
    public assetsContainer;

    // controllers
    public cameraController: EntityCamera;
    public animatorController: EntityAnimator;
    public moveController: EntityMove;
    public utilsController: EntityUtils;
    public actionsController: EntityActions;
    public meshController: EntityMesh;
    
    // entity
    public mesh: AbstractMesh; //outer collisionbox of player
    public playerMesh: AbstractMesh; //outer collisionbox of player
    public debugMesh: Mesh;
    public selectedMesh: Mesh;
    public characterChatLabel: Rectangle;
    public characterLabel: Rectangle;
    public sessionId: string;
    public entity: EntityState;
    public isCurrentPlayer:boolean;

    // character
    public type: string = "";
    public race: string = "";
    public name: string = "";
    public x: number;
    public y: number;
    public z: number;
    public rot: number;
    public health: number;
    public mana: number;
    public level: number;
    public experience: number;
    public location: string = "";
    public state: number = 0;
    public AI_CURRENT_STATE: number = 0;

    public raceData;

    // flags
    public blocked: boolean = false; // if true, player will not moved

    constructor(
        entity:EntityState,
        room:Room, 
        scene: Scene, 
        ui:UserInterface,
        shadow:CascadedShadowGenerator, 
        navMesh:NavMesh,
        assetsContainer:AssetContainer[],
    ) {
 
        // setup class variables
        this._scene = scene;
        this._room = room;
        this._navMesh = navMesh;
        this.assetsContainer = assetsContainer;
        this.ui = ui;
        this._shadow = shadow;
        this.sessionId = entity.sessionId; // network id from colyseus
        this.isCurrentPlayer = this._room.sessionId === entity.sessionId;
        this.entity = entity;
        this.raceData = Races[entity.race];
        
        // update player data from server data
        Object.assign(this, this.entity);

        // spawn player
        this.spawn(entity);
    }

    public async spawn(entity) {

        // load mesh controllers
        this.meshController = new EntityMesh(this._scene, this.assetsContainer, this.entity, this._room, this.isCurrentPlayer);
        await this.meshController.load();
        this.mesh = this.meshController.mesh;
        this.playerMesh = this.meshController.playerMesh;
        this.debugMesh = this.meshController.debugMesh;
        this.selectedMesh = this.meshController.selectedMesh;

        // add mesh to shadow generator
        this._shadow.addShadowCaster(this.meshController.mesh, true);

        // add all entity related stuff
        this.animatorController = new EntityAnimator(this.meshController.getAnimation(), this.entity.race);
        this.moveController = new EntityMove(this.mesh, this._navMesh, this.isCurrentPlayer);
        this.moveController.setPositionAndRotation(entity); // set next default position from server entity

        ///////////////////////////////////////////////////////////
        // entity network event
        // colyseus automatically sends entity updates, so let's listen to those changes
        this.entity.onChange(() => {

            // make sure players are always visible
            this.playerMesh.isVisible = true;

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
        // player render loop
        this._scene.registerBeforeRender(() => {

            // animate player continuously
            this.animatorController.animate(this, this.mesh.position, this.moveController.getNextPosition());

            // if entity is selected, show 
            //console.log(this.debugMesh, global.T5C.selectedEntity);
            if(this.selectedMesh && this.selectedMesh.visibility){
                if(global.T5C.selectedEntity && global.T5C.selectedEntity.sessionId === this.sessionId){
                    this.selectedMesh.isVisible = true;
                }else{
                    this.selectedMesh.isVisible = false;
                }
            }

        });

        //////////////////////////////////////////////////////////////////////////
        // misc
        this.characterLabel = this.createLabel(entity.name);
        this.characterChatLabel = this.createChatLabel(entity.name);
      
    }

    public update(){

        if(this.AI_CURRENT_STATE === AI_STATE.SEEKING || this.AI_CURRENT_STATE === AI_STATE.ATTACKING){
            this.debugMesh.material = this._scene.getMaterialByName('debug_entity_active');
        }

        if(this.AI_CURRENT_STATE === AI_STATE.WANDER){
            this.debugMesh.material = this._scene.getMaterialByName('debug_entity_neutral');
        }

        // tween entity
        if(this && this.moveController){
            this.moveController.tween();
        }
    }

    // basic performance (only enable entities in a range around the player)
    public lod(_currentPlayer){
        this.mesh.setEnabled(false); 
        let entityPos = this.position();
        let playerPos = _currentPlayer.position();
        let distanceFromPlayer = Vector3.Distance(playerPos, entityPos);
        if(distanceFromPlayer < Config.PLAYER_VIEW_DISTANCE){
            this.mesh.setEnabled(true); 
        } 
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
        rect1.isVisible = true;
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

    public position() {
        return new Vector3(this.x, this.y, this.z);
     }

    public remove() {
       this.characterLabel.dispose();
       this.characterChatLabel.dispose();
       this.mesh.dispose();
    }
}