import { Scene } from "@babylonjs/core/scene";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import { Color3 } from "@babylonjs/core/Maths/math.color";


import { Room } from "colyseus.js";
import { EntityState } from "../../../server/rooms/schema/EntityState";
import Config from "../../Config";

export class EntityMesh {

    private _scene:Scene;
    private assetsContainer: AssetContainer;
    private _entity: EntityState;
    private _room: Room;
    private _animationGroups: AnimationGroup[];
    public mesh: Mesh;
    public playerMesh;
    public isCurrentPlayer:boolean;
    public debugMesh: Mesh;

    constructor(scene:Scene, assetsContainer, entity:EntityState, room: Room, isCurrentPlayer:boolean) {
        this._scene = scene;
        this.assetsContainer = assetsContainer;
        this._entity = entity;
        this._room = room;
        this.isCurrentPlayer = isCurrentPlayer;
    }

    public async load() {

        let config = Config.entities[this._entity.race];

        // create collision cube
        const box = MeshBuilder.CreateBox("root_"+this._entity.race, {width: 2, height: 4}, this._scene);
        box.visibility = 0;

        // set collision mesh
        this.mesh = box;
        this.mesh.metadata = {
            sessionId: this._entity.sessionId,
            type: this._entity.type,
            race: this._entity.race,
            name: this._entity.name,
        }

        // debug aggro mesh
        if(this._entity.type === 'entity'){

            var material = this._scene.getMaterialByName('debug_entity_neutral');
            const sphere = MeshBuilder.CreateCylinder("debug_"+this._entity.race, {diameter: (Config.MONSTER_AGGRO_DISTANCE * 2), height: .1}, this._scene);
            sphere.visibility = .3;
            sphere.parent = box;
            sphere.material = material;
            this.debugMesh = sphere;
        }
        
        // load player mesh
        const result = this.assetsContainer[this._entity.race].instantiateModelsToScene(
            name => this._entity.sessionId,
            false,
            { 
                doNotInstantiate: false,
            }
        );
        const playerMesh = result.rootNodes[0]; 
        this._animationGroups = result.animationGroups;
        //console.log('LOADED ENTITY MESH', this._entity.race, result);

        // set initial player scale & rotation
        playerMesh.name = this._entity.sessionId+"_mesh";
        playerMesh.parent = box;
        playerMesh.rotationQuaternion = null; // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
        if(config.rotationFix){
            playerMesh.rotation.set(0, config.rotationFix, 0);
        }
        playerMesh.scaling.set(config.scale,config.scale,config.scale);
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
            let meshes = ev.meshUnderPointer.getChildMeshes();
            let mesh = meshes.length === 2 ? meshes[1] : meshes[2]
            mesh.outlineColor = new Color3(0,1,0);
            mesh.outlineWidth = 3;
            mesh.renderOutline = true;
            //this.characterLabel.isVisible = true;
        }));
        
        // register hover out player
        this.mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, (ev) => {
            let meshes = ev.meshUnderPointer.getChildMeshes();
            let mesh = meshes.length === 2 ? meshes[1] : meshes[2]
            mesh.renderOutline = false;
            //this.characterLabel.isVisible = false;
        }));

    }

    public getAnimation(){
        return this._animationGroups;
    }

}