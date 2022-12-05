import { MeshBuilder, SceneLoader, AnimationGroup } from "@babylonjs/core";

export class PlayerMesh {

    private scene;
    private _animationGroups: AnimationGroup[];
    public mesh;
    public playerMesh;

    constructor(scene) {
        this.scene = scene;
    }

    public async load(entity) {

        // create collision cube
        const box = MeshBuilder.CreateBox("collision", {width: 2, height: 4}, this.scene);
        box.visibility = 0;

        // set mesh
        this.mesh = box;
        //this.mesh.parent = this;
        this.mesh.checkCollisions = true;
        this.mesh.metadata = {
            sessionId: entity.sessionId,
            type: 'player',
        }

        // load player mesh
        const result = await SceneLoader.ImportMeshAsync(null, "./models/", "player_hobbit.glb", this.scene);
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
    }

    public getAnimation(){
        return this._animationGroups;
    }

}