import { MeshBuilder, SceneLoader, AnimationGroup, Mesh, Scene, ExecuteCodeAction, ActionManager, Color3 } from "@babylonjs/core";
import { Room } from "colyseus.js";
import { PlayerState } from "../../../server/rooms/schema/PlayerState";

export class PlayerMesh {

    private _scene:Scene;
    private _entity: PlayerState;
    private _room: Room;
    private _animationGroups: AnimationGroup[];
    public mesh: Mesh;
    public playerMesh;
    public isCurrentPlayer:boolean;

    constructor(scene:Scene, entity:PlayerState, room: Room, isCurrentPlayer:boolean) {
        this._scene = scene;
        this._entity = entity;
        this._room = room;
        this.isCurrentPlayer = isCurrentPlayer;
    }

    public async load() {

        // create collision cube
        const box = MeshBuilder.CreateBox("collision", {width: 2, height: 4}, this._scene);
        box.visibility = 0;

        // set collision mesh
        this.mesh = box;
        this.mesh.metadata = {
            sessionId: this._entity.sessionId,
            type: this._entity.type,
            name: this._entity.name,
        }

        // load player mesh
        const result = await SceneLoader.ImportMeshAsync(null, "./models/", "player_hobbit.glb", this._scene);
        const playerMesh = result.meshes[0];
        this._animationGroups = result.animationGroups;

        // set initial player scale & rotation
        playerMesh.name = "player_mesh";
        playerMesh.parent = box;
        playerMesh.rotationQuaternion = null; // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
        playerMesh.rotation.set(0, 0, 0);
        playerMesh.scaling.set(0.02, 0.02, 0.02);
        playerMesh.visibility = 0;
        this.playerMesh = playerMesh;

        // start action manager
        this.mesh.actionManager = new ActionManager(this._scene);

        // setup collisions for current player
        if(this.isCurrentPlayer){
            
            // teleport collision
            // terrible stuff here, I need to improve to be more dynamic
            let targetMesh = this._scene.getMeshByName("teleport");
            this.mesh.actionManager.registerAction(
                new ExecuteCodeAction({
                        trigger: ActionManager.OnIntersectionEnterTrigger,
                        parameter: targetMesh
                    },() => {
                        if(this.mesh.metadata.sessionId === this._entity.sessionId){
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
            //this.characterLabel.isVisible = true;
        }));
        
        // register hover out player
        this.mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, (ev) => {
            let mesh = ev.meshUnderPointer.getChildMeshes()[1];
            mesh.renderOutline = false;
            //this.characterLabel.isVisible = false;
        }));

    }

    public getAnimation(){
        return this._animationGroups;
    }

}