import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { BlackAndWhitePostProcess } from "@babylonjs/core/PostProcesses/blackAndWhitePostProcess";
import { Player } from "../Player";
import { PlayerInput } from "../../Controllers/PlayerInput";
import { RayHelper } from "@babylonjs/core/Debug/rayHelper";
import { Ray } from "@babylonjs/core/Culling/ray";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

export class PlayerCamera {
    private player: Player;
    public camera;
    private _scene: Scene;
    private _input: PlayerInput;
    public _camRoot;
    public cameraPos;
    private _postProcess: BlackAndWhitePostProcess; //
    private rayHelper;

    constructor(player) {
        this._scene = player._scene;
        this._input = player._input;
        this.init();
    }

    public init() {
        // root camera parent that handles positioning of the camera to follow the player
        this._camRoot = new TransformNode("camera_root");
        this._camRoot.position = new Vector3(0, 0.5, 0); //initialized at (0,0,0)

        // to face the player from behind (180 degrees)
        this._camRoot.rotation = new Vector3(0, (3 / 4) * Math.PI, 0);

        // rotations along the x-axis (up/down tilting)
        const yTilt = new TransformNode("camera_ytilt");

        // adjustments to camera view to point down at our player
        yTilt.rotation = new Vector3(0.6, 0, 0);
        yTilt.parent = this._camRoot;

        // our actual camera that's pointing at our root's position
        this.camera = new UniversalCamera("camera", new Vector3(0, 0, -45), this._scene);
        this.camera.lockedTarget = this._camRoot.position;
        this.camera.fov = 0.35;
        this.camera.parent = yTilt;
        this.camera.inputs.clear();
        this.camera.position.z = -50;

        // set as active camera
        this._scene.activeCamera = this.camera;
        //this._scene.cameraToUseForPointers = this.camera; // is this necessary?

        //
        this.cameraPos = this.camera.position;

        // text ssao
        //const ssao = new SSAORenderingPipeline("ssaopipeline", this._scene, 1, this.camera);
    }
    public attach(player: Player) {
        this.player = player;
        this._camRoot.parent = player;
    }

    public update(): void {
        let preventVertical = true;

        // rotate camera around the Y position if right click is true
        if (!this._input.middle_click) {
            return;
        }

        // only do vertical if allowed
        let rotationX = 0;
        if (!preventVertical) {
            rotationX =
                Math.abs(this._camRoot.rotation.x + this._input.movementY) < 0.5 ? this._camRoot.rotation.x + this._input.movementY : this._camRoot.rotation.x;
        }

        // set camera delta
        this.player._game.deltaCamY = this.player._game.deltaCamY + this._input.movementX;

        // set horizontal rotation
        const rotationY = this._camRoot.rotation.y + this._input.movementX;

        // apply canmera rotation
        this._camRoot.rotation = new Vector3(rotationX, rotationY, 0);

        //
        this.castRay();
    }

    public zoom(deltaY): void {
        // zoom in/out
        if (deltaY > 0 && this.camera.position.z > -50) this.camera.position.z -= 2;
        if (deltaY < 0 && this.camera.position.z < -20) this.camera.position.z += 2;
    }

    public vecToLocal(vector, mesh){
        var m = mesh.getWorldMatrix();
        var v = Vector3.TransformCoordinates(vector, m);
		return v;		 
    }

    public castRay(){       

        /*
        todo: WIP
        if(this.rayHelper){
            this.rayHelper.dispose()
        }

        const ray = this.camera.getForwardRay(50) as Ray;
        this.rayHelper = new RayHelper(ray);		
		this.rayHelper.show(this._scene);		

        var pickInfos = ray.intersectsMeshes(this._scene.meshes)
        if(pickInfos.length > 0){
            pickInfos.forEach((m:any) => {
                console.log('hiding', m.pickedMesh.name);
                m.pickedMesh.setEnabled(false);
            } );
        }
            */
    }

    // post processing effect black and white
    // used when current player dies and click ressurects
    public vfx_black_and_white_on() {
        if (this._postProcess) {
            this._postProcess.dispose();
        }
        this._postProcess = new BlackAndWhitePostProcess("bandw", 1.0, this.camera);
    }

    public vfx_black_and_white_off() {
        if (this._postProcess) {
            this._postProcess.dispose();
        }
    }
}
