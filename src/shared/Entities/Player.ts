import { TransformNode, Scene, MeshBuilder, Vector3, AnimationGroup, SceneLoader, AbstractMesh, ActionManager, ExecuteCodeAction, CascadedShadowGenerator, Color3, PointerEventTypes} from "@babylonjs/core";
import { Control, Rectangle, TextBlock, TextWrapping } from "@babylonjs/gui";
import { PlayerState } from "../../server/rooms/schema/PlayerState";

import Config from "../Config";
import State from "../../client/Screens/Screens";
import { PlayerInputs } from "../types";
import { PlayerCamera } from "./Player/PlayerCamera";
import { PlayerAnimator } from "./Player/PlayerAnimator";
import { PlayerMove } from "./Player/PlayerMove";
import { PlayerUtils } from "./Player/PlayerUtils";
import { PlayerActions } from "./Player/PlayerActions";
import { PlayerMesh } from "./Player/PlayerMesh";

export class Player extends TransformNode {
    
    public scene: Scene;
    public _room;
    public ui;
    private _input;
    private _shadow;
    private _navMesh;

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

    // flags
    public blocked: boolean = false; // if true, player will not moved

    constructor(entity, room, scene: Scene, ui, input, shadow:CascadedShadowGenerator, navMesh) {
        super("player", scene);

        this.scene = scene;
        this._room = room;
        this._navMesh = navMesh;
        this.ui = ui;
        this._shadow = shadow;
        this.sessionId = entity.sessionId; // network id from colyseus
        this.entity = entity;
        this.isCurrentPlayer = this._room.sessionId === entity.sessionId;
        this._input = input;
        this.playerInputs = [];

        // default
        this.name = entity.name;
        this.x = entity.x;
        this.y = entity.y;
        this.z = entity.z;
        this.rot = entity.rot;
        this.health = entity.health;
        this.level = entity.level;
        this.experience = entity.experience;

        // spawn player
        this.spawn(entity);
    }

    private async spawn(entity) {

        this.meshController = new PlayerMesh(this._scene);
        await this.meshController.load(this.entity);
        this.mesh = this.meshController.mesh;
        this.playerMesh = this.meshController.playerMesh;

        // add mesh to shadow generator
        this._shadow.addShadowCaster(this.meshController.mesh, true);

        // if myself, add all player related stuff
        if (this.isCurrentPlayer) {
            this.utilsController = new PlayerUtils(this._scene, this._room);
            this.cameraController = new PlayerCamera(this._scene, this._input);
            this.actionsController = new PlayerActions();
        }
        this.animatorController = new PlayerAnimator(this.meshController.getAnimation());
        this.moveController = new PlayerMove(this.mesh, this._navMesh, this.isCurrentPlayer);
        this.moveController.setPositionAndRotation(entity); // set default entity position

        // render loop
        this.scene.registerBeforeRender(() => {

            // animate player continuously
            this.animatorController.animate(this, this.mesh.position, this.moveController.getNextPosition());

            if (this.isCurrentPlayer) {

                // mova camera as player moves
                this.cameraController.follow(this.mesh.position);
            }    
        });

        // add player chatbox
        this.characterLabel = this.createLabel(entity.name);
        this.characterChatLabel = this.createChatLabel(entity.name);

        ///////////////////////////////////////////////////////////
        // entity network event
        // colyseus automatically sends entity updates, so let's listen to those changes
        this.entity.onChange(() => {

            // make sure players are visible
            this.playerMesh.visibility = 1;

            // update player movement from server
            // only do it, if player is not blocked.
            if(!this.blocked){

                // if player has no health, prevent moving
                if(entity.health == 0){
                    this.blocked = true;
                }

                // update player data from server data
                this.name = entity.name;
                this.x = entity.x;
                this.y = entity.y;
                this.z = entity.z;
                this.rot = entity.rot;
                this.health = entity.health;
                this.level = entity.level;
                this.experience = entity.experience;
                this.moveController.setPositionAndRotation(this.entity);

                // do server reconciliation if current player only
                if (this.isCurrentPlayer) {
                    this.moveController.reconcileMove(this.entity.sequence); // set default entity position
                }
            }
        });

        // start action manager
        this.mesh.actionManager = new ActionManager(this.scene);

        // collision with  other meshes
        if(this.mesh){

            if(this.isCurrentPlayer){

                // teleport collision
                let targetMesh = this.scene.getMeshByName("teleport");
                this.mesh.actionManager.registerAction(
                    new ExecuteCodeAction({
                            trigger: ActionManager.OnIntersectionEnterTrigger,
                            parameter: targetMesh
                        },() => {
                            if(this.mesh.metadata.sessionId === this.entity.sessionId){
                                this.blocked = true;
                                this._room.send("playerTeleport", targetMesh.metadata.location);
                            }
                        }
                    )
                );

            }

            // register hover over player
            this.mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (ev) => {
                let mesh = ev.meshUnderPointer.getChildMeshes()[1];
                mesh.outlineColor = new Color3(0,1,0);
                mesh.outlineWidth = 3;
                mesh.renderOutline = true;
                this.characterLabel.isVisible = true;
            }));
            
            // register hover out player
            this.mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, (ev) => {
                let mesh = ev.meshUnderPointer.getChildMeshes()[1];
                mesh.renderOutline = false;
                this.characterLabel.isVisible = false;
            }));

        }

        if(this.isCurrentPlayer){

            // on teleport confirmation
            this._room.onMessage('playerTeleportConfirm', (location) => {
                this.actionsController.processAction('teleport', {
                    room: this._room,
                    location: location
                })
            });

            // on player action
            this._room.onMessage('playerActionConfirmation', (data) => {
                console.log('playerActionConfirmation', data);
                this.actionsController.processAction(data.action, {
                    ui: this.ui,
                    data: data,
                    entity: this.entity,
                    player_mesh: this.playerMesh
                })
                // send bullet locally
                let start = data.fromPosition;
                let end = data.toPosition;
                this.utilsController.fire(
                    new Vector3(start.x, start.y, start.z), 
                    new Vector3(end.x, end.y, end.z), 
                    this.mesh
                );
            });

            // on player click
            this._scene.onPointerObservable.add((pointerInfo:any) => {
            
                // if other player, send to server: target loses 5 health
                if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
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
                        this.utilsController.fire(start, end, this.ui._players[targetSessionId].mesh);
                    }
                }

                // other actions here

            });
        }
      
    }

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