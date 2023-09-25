import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { BlackAndWhitePostProcess } from "@babylonjs/core/PostProcesses/blackAndWhitePostProcess";
import { Player } from "../Player";
import { PlayerInput } from "../../Controllers/PlayerInput";

export class PlayerCamera {
    private player: Player;
    public camera;
    private _scene: Scene;
    private _input: PlayerInput;
    public _camRoot;
    public cameraPos;
    private _postProcess: BlackAndWhitePostProcess; //

    constructor(player) {
        this.player = player;
        this._scene = player._scene;
        this._input = player._input;
        this._build(player);
    }

    private _build(player: Player) {
        // root camera parent that handles positioning of the camera to follow the player
        this._camRoot = new TransformNode("root");
        this._camRoot.position = new Vector3(0, 1.5, 0); //initialized at (0,0,0)

        // to face the player from behind (180 degrees)
        this._camRoot.rotation = new Vector3(0, (3 / 4) * Math.PI, 0);

        // rotations along the x-axis (up/down tilting)
        const yTilt = new TransformNode("ytilt");

        // adjustments to camera view to point down at our player
        yTilt.rotation = new Vector3(0.6, 0, 0);
        yTilt.parent = this._camRoot;

        // our actual camera that's pointing at our root's position
        this.camera = new UniversalCamera("cam", new Vector3(0, 0, -45), this._scene);
        this.camera.lockedTarget = this._camRoot.position;
        this.camera.fov = 0.35;
        this.camera.parent = yTilt;

        // set as active camera
        this._scene.activeCamera = this.camera;

        //
        this.cameraPos = this.camera.position;
    }

    public follow(): void {
        // debug: testing online camera lag
        if (this._input.keyboard_c === false) {
            // camera must follow player mesh (the local one, else it will be laggy has the camera tries to catch up with server position)
            this._camRoot.position = Vector3.Lerp(this._camRoot.position, this.player.moveController.getNextPosition(), 0.1);
            //this._camRoot.position = new Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
        }

        // rotate camera around the Y position if right click is true
        if (this._input.middle_click) {
            const rotationX =
                Math.abs(this._camRoot.rotation.x + this._input.movementY) < 0.5 ? this._camRoot.rotation.x + this._input.movementY : this._camRoot.rotation.x;
            const rotationY = this._camRoot.rotation.y + this._input.movementX;
            this._camRoot.rotation = new Vector3(rotationX, rotationY, 0);
        }
    }

    public zoom(deltaY): void {
        // zoom in/out
        if (deltaY > 0 && this.camera.position.z > -50) this.camera.position.z -= 2;
        if (deltaY < 0 && this.camera.position.z < -20) this.camera.position.z += 2;
    }

    // post processing effect black and white
    // used when current player dies and click ressurects
    public bw(activate: boolean) {
        if (activate === true && !this._postProcess) {
            this._postProcess = new BlackAndWhitePostProcess("bandw", 1.0, this.camera);
        }
        if (activate === false && this._postProcess) {
            this._postProcess.dispose();
        }
    }
}
