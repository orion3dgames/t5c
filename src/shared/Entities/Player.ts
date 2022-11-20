import { TransformNode, Scene, UniversalCamera, Vector3, AnimationGroup, SceneLoader, AbstractMesh, ActionManager, ExecuteCodeAction} from "@babylonjs/core";
import { Rectangle, TextBlock } from "@babylonjs/gui";
import { PlayerSchema } from "../../server/rooms/schema/PlayerSchema";

import { roundToTwo } from "../Utils"
import Config from "../Config";
import State from "../../client/Screens/Screens";
import { PlayerInputs } from "../types";

export class Player extends TransformNode {
    public camera;
    public scene: Scene;
    public _room;
    public ui;
    private _input;
    private _shadow;

    //Player
    public mesh: AbstractMesh; //outer collisionbox of player
    public characterLabel: Rectangle;

    //Camera
    private _camRoot: TransformNode;
    private _yTilt: TransformNode;

    //player movement vars
    private _deltaTime: number = 0;
    private _h: number;
    private _v: number;

    // animation trackers
    private playerAnimations: AnimationGroup[];
    private _currentAnim: AnimationGroup = null;
    private _prevAnim: AnimationGroup;

    //animations
    private _walk: AnimationGroup;
    private _idle: AnimationGroup;

    public playerPosition: Vector3;
    public playerDirection: Vector3;
    public playerNextPosition: Vector3;
    public playerNextRotation: Vector3;
    public playerMove: any;
    public playerInputs: PlayerInputs[];
    public playerLatestSequence: number;
    public playerNextLocation: string;

    private isCurrentPlayer: boolean;
    public sessionId: string;

    public entity: PlayerSchema;
    public x: number;
    public y: number;
    public z: number;
    public rot: number;

    constructor(entity, room, scene: Scene, _ui, input, _shadow) {
        super("player", scene);

        this.scene = scene;
        this._room = room;
        this.ui = _ui;
        this._shadow = _shadow;
        this.sessionId = entity.sessionId; // network id from colyseus
        this.entity = entity;
        this.isCurrentPlayer = this._room.sessionId === entity.sessionId;
        this._input = input;
        this.playerInputs = [];

        // spawn player
        this.spawn(entity);
    }

    // todo: this should a global utils
    private addLabel(mesh, text) {

        var rect1 = new Rectangle();
        rect1.width = "100px";
        rect1.height = "40px";
        rect1.cornerRadius = 20;
        rect1.color = "white";
        rect1.thickness = 4;
        rect1.background = "black";
        this.ui._playerUI.addControl(rect1);
        rect1.linkWithMesh(mesh);
        rect1.linkOffsetY = -150;

        var label = new TextBlock();
        label.text = text;
        rect1.addControl(label);

        this.characterLabel = rect1;

    }

    private async spawn(entity) {

        //console.log(entity);

        // load mesh
        const result = await SceneLoader.ImportMeshAsync(null, "./models/", "player_fixed.glb", this._scene);
        const playerMesh = result.meshes[0];
        this.playerAnimations = result.animationGroups;

        // add shadows
        this._shadow.addShadowCaster(playerMesh, true);
        playerMesh.receiveShadows = true;

        // set initial scale 
        playerMesh.scaling.set(0.04, 0.04, 0.04);

        // save entities
        this.playerNextPosition = new Vector3(this.entity.x, this.entity.y, this.entity.z);
        this.playerNextRotation = new Vector3(0, this.entity.rot, 0);

        // hide mesh (DEBUG)
        //playerMesh.setEnabled(false);

        // set mesh
        this.mesh = playerMesh;
        this.mesh.parent = this;
        this.mesh.metadata = {
            sessionId: entity.sessionId
        }

        // add player nameplate
        this.addLabel(this.mesh, entity.username);

        // find animations
        this._idle = this.playerAnimations.find(o => o.name === 'Hobbit_Idle');
        this._walk = this.playerAnimations.find(o => o.name === 'Hobbit_Walk');
        //this._idle = this._scene.getAnimationGroupByName("Hobbit_Idle");
        //this._walk = this._scene.getAnimationGroupByName("Hobbit_Walk");

        // prepare animations
        this._setUpAnimations();

        // if myself, add all player related stuff
        if (this.isCurrentPlayer) {
            this._setupPlayerCamera();
        }

        //
        this.scene.registerBeforeRender(() => {
            this._animatePlayer();
            if (this.isCurrentPlayer) {
                this._updateCamera();
            }    
        });

        ///////////////////////////////////////////////////////////
        // entity network event
        // colyseus automatically sends entity updates, so let's listen to those changes
        this.entity.onChange(() => {

            console.log('#UPDATE SERVER', this.entity);

            // update player movement from server
            this.playerNextPosition = new Vector3(this.entity.x, this.entity.y, this.entity.z);
            this.playerNextRotation = new Vector3(0, this.entity.rot, 0);

            // store latest sequence processed by server
            this.playerLatestSequence = this.entity.sequence;

            // do server reconciliation
            this.processLocalMove();

            // set location
            if(this.isCurrentPlayer && global.T5C.currentLocation.key != entity.location){
                //console.log("CHANGING ZONE", entity);
                //this.teleport(entity.location);
            }

        });

        //--COLLISIONS--

        if(this.mesh && this.isCurrentPlayer){
            let targetMesh = this.scene.getMeshByName("teleport");
            this.mesh.actionManager = new ActionManager(this.scene);
            this.mesh.actionManager.registerAction(
                new ExecuteCodeAction(
                    {
                        trigger: ActionManager.OnIntersectionEnterTrigger,
                        parameter: targetMesh
                    },
                    (collision) => {
                        
                        if(this.mesh.metadata.sessionId === this.entity.sessionId){
                            console.log('COLLISION WITH PORTAL, TELPORTING TO ZONE',collision, this.mesh.metadata, targetMesh.metadata.location);
                            this.teleport(targetMesh.metadata.location);
                        }
                        /*
                        }
                        //this.teleport(targetMesh.metadata.location);
                        /*
                        this._room.send('playerTeleport', {
                            location: targetMesh.metadata.location,
                            playerId: this.entity.sessionId
                        });*/
                    }
                )
            );
        }
    }

    // 
    public teleport(location){
        this._room.leave();
        global.T5C.currentLocation = Config.locations[location];
        global.T5C.currentRoomID = "";
        global.T5C.nextScene = State.GAME;
    }

    // apply movement
    public move(input) {
        let rotationY = Math.atan2(input.h, input.v);
        this.playerNextPosition.x -= input.h * Config.PLAYER_SPEED;
        this.playerNextPosition.z -= input.v * Config.PLAYER_SPEED;
        this.playerNextRotation.y = this.playerNextRotation.y + (rotationY - this.playerNextRotation.y);
    }


    // server Reconciliation. Re-apply all the inputs not yet processed by the server
    public processLocalMove() {

        // if nothing to apply, do nothin
        if (!this.playerInputs.length) return false

        var j = 0;
        while (j < this.playerInputs.length) {

            var nextInput = this.playerInputs[j];

            if (nextInput.seq <= this.playerLatestSequence) {
                // Already processed. Its effect is already taken into account into the world update
                // we just got, so we can drop it.
                this.playerInputs.splice(j, 1);
            } else {
                // Not processed by the server yet. Re-apply it.
                this.move(nextInput);
                //console.log('#' + nextInput.seq + ' MOVING LOCALLY', this.playerNextPosition.x, this.playerNextPosition.z, this.playerNextRotation.y);
                j++;
            }

        }

    }

    private _setUpAnimations(): void {

        this.scene.stopAllAnimations();

        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;

        //initialize current and previous
        this._currentAnim = this._idle;
        this._prevAnim = this._walk;
    }

    private roundToTwo(num: number) {
        return Math.round(num * 100) / 100;
    }

    private _animatePlayer(): void {

        // if position has changed
        if (
            (
                roundToTwo(this.mesh.position.x) !== roundToTwo(this.playerNextPosition.x) ||
                roundToTwo(this.mesh.position.y) !== roundToTwo(this.playerNextPosition.y)
            )
        ) {
            this._currentAnim = this._walk;
        } else {
            this._currentAnim = this._idle;
        }

        if (this._currentAnim != null && this._prevAnim !== this._currentAnim) {
            this._prevAnim.stop();
            this._currentAnim.play(this._currentAnim.loopAnimation);
            this._prevAnim = this._currentAnim;
        }
    }

    private _updateCamera(): void {

        // camera must follow player 
        let centerPlayer = this.mesh.position.y + 2;
        this._camRoot.position = Vector3.Lerp(this._camRoot.position, new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z), 0.4);

        // rotate camera around the Y position if right click is true
        if (this._input.right_click) {

            // ddaydd to implement
            //let rotationY = this.camera.rotation.y -= this._input.h;
            //this.camera.rotation = new Vector3(0, rotationY, 0);
        }
    }

    private _setupPlayerCamera() {

        // root camera parent that handles positioning of the camera to follow the player
        this._camRoot = new TransformNode("root");
        this._camRoot.position = new Vector3(0, 0, 0); //initialized at (0,0,0)

        // to face the player from behind (180 degrees)
        this._camRoot.rotation = new Vector3(0, Math.PI, 0);

        // rotations along the x-axis (up/down tilting)
        let yTilt = new TransformNode("ytilt");

        // adjustments to camera view to point down at our player
        yTilt.rotation = new Vector3(0.50, 0, 0);
        this._yTilt = yTilt;
        yTilt.parent = this._camRoot;

        // our actual camera that's pointing at our root's position
        this.camera = new UniversalCamera("cam", new Vector3(0, 0, -50), this.scene);
        this.camera.lockedTarget = this._camRoot.position;
        this.camera.fov = 0.47350045992678597;
        this.camera.parent = yTilt;

        // set as active camera
        this.scene.activeCamera = this.camera;

        return this.camera;
    }

}