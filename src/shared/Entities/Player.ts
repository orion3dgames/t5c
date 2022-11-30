import { TransformNode, Scene, MeshBuilder, Vector3, AnimationGroup, SceneLoader, AbstractMesh, ActionManager, ExecuteCodeAction} from "@babylonjs/core";
import { Rectangle, TextBlock } from "@babylonjs/gui";
import { PlayerSchema } from "../../server/rooms/schema/PlayerSchema";

import Config from "../Config";
import State from "../../client/Screens/Screens";
import { PlayerInputs } from "../types";
import { PlayerCamera } from "./Player/PlayerCamera";
import { PlayerAnimator } from "./Player/PlayerAnimator";
import { PlayerMove } from "./Player/PlayerMove";
import { PlayerUtils } from "./Player/PlayerUtils";

export class Player extends TransformNode {
    
    public scene: Scene;
    public _room;
    public ui;
    private _input;
    private _shadow;

    // controllers
    public cameraController: PlayerCamera;
    public animatorController: PlayerAnimator;
    public moveController: PlayerMove;
    public utilsController: PlayerUtils;

    //Player
    public mesh: AbstractMesh; //outer collisionbox of player
    public characterLabel: Rectangle;

    public playerPosition: Vector3;
    public playerDirection: Vector3;
    public playerNextPosition: Vector3;
    public playerNextRotation: Vector3;
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

    private async spawn(entity) {

        // create collision cube
        const box = MeshBuilder.CreateBox("collision", {width: 2, height: 4}, this.scene);
        box.visibility = 0;

        // set mesh
        this.mesh = box;
        this.mesh.parent = this;
        this.mesh.metadata = {
            sessionId: entity.sessionId
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

        // add mesh to shadow generator
        this._shadow.addShadowCaster(playerMesh, true);


        // if myself, add all player related stuff
        if (this.isCurrentPlayer) {
            this.utilsController = new PlayerUtils(this._scene, this._room);
            this.cameraController = new PlayerCamera(this._scene, this._input);
        }
        this.animatorController = new PlayerAnimator(result.animationGroups);
        this.moveController = new PlayerMove(this.mesh);
        this.moveController.setPositionAndRotation(entity); // set default entity position

        // add player nameplate
        this.characterLabel = this.utilsController.addLabel(this.mesh, this.ui, entity.username);

        // render loop
        this.scene.registerBeforeRender(() => {

            // animate player continuously
            this.animatorController.animate(this.mesh.position, this.playerNextPosition);

            if (this.isCurrentPlayer) {

                // mova camera as player moves
                this.cameraController.follow(this.mesh.position);
            }    
        });

        ///////////////////////////////////////////////////////////
        // entity network event
        // colyseus automatically sends entity updates, so let's listen to those changes
        this.entity.onChange(() => {

            console.log('#UPDATE SERVER', this.entity);

            // update player movement from server
            this.moveController.setPositionAndRotation(this.entity);

            // do server reconciliation if current player only
            if (this.isCurrentPlayer) {
                this.moveController.reconcileMove(this.entity.sequence); // set default entity position
            }

        });

        // collision with  other meshes
        if(this.mesh && this.isCurrentPlayer){

            // start action manager
            this.mesh.actionManager = new ActionManager(this.scene);

            // teleport collision
            let targetMesh = this.scene.getMeshByName("teleport");
            this.mesh.actionManager.registerAction(
                new ExecuteCodeAction({
                        trigger: ActionManager.OnIntersectionEnterTrigger,
                        parameter: targetMesh
                    },() => {
                        if(this.mesh.metadata.sessionId === this.entity.sessionId){
                            this._room.send("playerTeleport", targetMesh.metadata.location);
                        }
                    }
                )
            );

        }

        // listen to playerTeleportConfirm event
        this._room.onMessage('playerTeleportConfirm', (location) => {
            this.utilsController.teleport(location)
        });
    }

    public removePlayer() {
       this.characterLabel.dispose();
       this.mesh.dispose();
    }
}