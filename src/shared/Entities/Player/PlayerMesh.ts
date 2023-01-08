import { MeshBuilder, AssetContainer, Vector3, AnimationGroup, Mesh, Scene, ExecuteCodeAction, ActionManager, Color3 } from "@babylonjs/core";
import { Room } from "colyseus.js";
import { PlayerState } from "../../../server/rooms/schema/PlayerState";
import Config from "../../Config";

export class PlayerMesh {

    private _scene:Scene;
    private assetsContainer: AssetContainer;
    private _entity: PlayerState;
    private _room: Room;
    private _animationGroups: AnimationGroup[];
    public mesh: Mesh;
    public playerMesh;
    public isCurrentPlayer:boolean;

    constructor(scene:Scene, assetsContainer, entity:PlayerState, room: Room, isCurrentPlayer:boolean) {
        this._scene = scene;
        this.assetsContainer = assetsContainer;
        this._entity = entity;
        this._room = room;
        this.isCurrentPlayer = isCurrentPlayer;
    }

    public async load() {

        let config = Config.entities[this._entity.type];

        // create collision cube
        const box = MeshBuilder.CreateBox("root_"+this._entity.type, {width: 2, height: 4}, this._scene);
        box.visibility = 0;

        // set collision mesh
        this.mesh = box;
        this.mesh.metadata = {
            sessionId: this._entity.sessionId,
            type: this._entity.type,
            name: this._entity.name,
        }

        // load player mesh
        const result = this.assetsContainer[this._entity.type].instantiateModelsToScene(
            name => this._entity.sessionId,
            false,
            { 
                doNotInstantiate: false,
            }
        );
        const playerMesh = result.rootNodes[config.meshRootIndex]; 
        this._animationGroups = result.animationGroups;
        //console.log('LOADED ENTITY MESH', this._entity.type, result);

        // set initial player scale & rotation
        playerMesh.name = this._entity.type+"_mesh";
        playerMesh.parent = box;
        playerMesh.rotationQuaternion = null; // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
        if(config.rotationFix){
            playerMesh.rotation.set(0, config.rotationFix, 0);
        }
        playerMesh.scaling.set(config.scale,config.scale,config.scale);
        this.playerMesh = playerMesh;

        console.log(this._entity.type, config.scale, playerMesh.scaling);

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