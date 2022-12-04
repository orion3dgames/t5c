import { TransformNode, Scene, MeshBuilder, Vector3, AnimationGroup, SceneLoader, AbstractMesh, ActionManager, ExecuteCodeAction, CascadedShadowGenerator, Color3} from "@babylonjs/core";
import { Control, Rectangle, TextBlock, TextWrapping } from "@babylonjs/gui";
import { PlayerSchema } from "../../server/rooms/schema/PlayerSchema";

import Config from "../Config";
import State from "../../client/Screens/Screens";
import { PlayerInputs } from "../types";
import { PlayerCamera } from "./Player/PlayerCamera";
import { PlayerAnimator } from "./Player/PlayerAnimator";
import { PlayerMove } from "./Player/PlayerMove";
import { PlayerUtils } from "./Player/PlayerUtils";
import { PlayerActions } from "./Player/PlayerActions";

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

    //Player
    public mesh: AbstractMesh; //outer collisionbox of player
    public playerMesh: AbstractMesh; //outer collisionbox of player
    public characterChatLabel: Rectangle;
    public characterLabel: Rectangle;
    public playerInputs: PlayerInputs[];
    private isCurrentPlayer: boolean;
    public sessionId: string;
    public entity: PlayerSchema;

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

        // create collision cube
        const box = MeshBuilder.CreateBox("collision", {width: 2, height: 4}, this.scene);
        box.visibility = 0;

        // set mesh
        this.mesh = box;
        this.mesh.parent = this;
        this.mesh.metadata = {
            sessionId: entity.sessionId,
            type: 'player',
        }

        // load player mesh
        const result = await SceneLoader.ImportMeshAsync(null, "./models/", "player_hobbit.glb", this._scene);
        const playerMesh = result.meshes[0];

        // set initial player scale & rotation
        playerMesh.name = "player_mesh";
        playerMesh.parent = box;
        playerMesh.rotationQuaternion = null; // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
        playerMesh.rotation.set(0, 0, 0);
        playerMesh.scaling.set(0.02, 0.02, 0.02);
        playerMesh.visibility = 0;
        this.playerMesh = playerMesh;

        // add mesh to shadow generator
        //console.log(this._shadow);
        //this._shadow.addShadowCaster(playerMesh, true);

        // if myself, add all player related stuff
        if (this.isCurrentPlayer) {
            this.utilsController = new PlayerUtils(this._scene, this._room);
            this.cameraController = new PlayerCamera(this._scene, this._input);
            this.actionsController = new PlayerActions();
        }
        this.animatorController = new PlayerAnimator(result.animationGroups);
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

            this.playerMesh.visibility = 1;

            // update player movement from server
            // only do it, if player is not blocked.
            if(!this.blocked){

                if(entity.health < 1){
                    this.blocked = true;
                }

                //console.log('#UPDATE SERVER', this.entity);
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

            this.mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (ev) => {
                let mesh = ev.meshUnderPointer.getChildMeshes()[1];
                mesh.outlineColor = new Color3(0,1,0);
                mesh.outlineWidth = 3;
                mesh.renderOutline = true;
                this.characterLabel.isVisible = true;
            }));
            
            this.mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, (ev) => {
                let mesh = ev.meshUnderPointer.getChildMeshes()[1];
                mesh.renderOutline = false;
                this.characterLabel.isVisible = false;
            }));

        }

        if(this.isCurrentPlayer){
            this._room.onMessage('playerTeleportConfirm', (location) => {
                this.actionsController.processAction('teleport', {
                    room: this._room,
                    location: location
                })
            });

            this._room.onMessage('playerActionConfirmation', (data) => {
                console.log('playerActionConfirmation', data);
                this.actionsController.processAction(data.action, {
                    ui: this.ui,
                    data: data,
                    entity: this.entity,
                    player_mesh: this.playerMesh
                })
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