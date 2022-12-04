import { TransformNode, Scene, UniversalCamera, Vector3, Scalar } from "@babylonjs/core";

export class PlayerCamera {
    public camera;
    private _scene: Scene;
    private _input;
    private _camRoot;
    constructor(scene: Scene, input) {
        this._scene = scene;
        this._input = input;
        this._build();
    }

    degrees_to_radians(degrees)
    {
        var pi = Math.PI;
        return degrees * (pi/180);
    }

    private _build() {

        // root camera parent that handles positioning of the camera to follow the player
        this._camRoot = new TransformNode("root");
        this._camRoot.position = new Vector3(0, 0, 0); //initialized at (0,0,0)

        // to face the player from behind (180 degrees)
        this._camRoot.rotation = new Vector3(0, this.degrees_to_radians(145), 0);

        // rotations along the x-axis (up/down tilting)
        let yTilt = new TransformNode("ytilt");

        // adjustments to camera view to point down at our player
        yTilt.rotation = new Vector3(0.60, 0, 0);
        yTilt.parent = this._camRoot;

        // our actual camera that's pointing at our root's position
        this.camera = new UniversalCamera("cam", new Vector3(0, 0, -45), this._scene);
        this.camera.lockedTarget = this._camRoot.position;
        this.camera.fov = 0.35;
        this.camera.parent = yTilt;

        // set as active camera
        this._scene.activeCamera = this.camera;
    }

    public follow(playerPosition): void {

        // camera must follow player 
        let centerPlayer = playerPosition.y + 2;
        this._camRoot.position = Vector3.Lerp(this._camRoot.position, new Vector3(playerPosition.x, centerPlayer, playerPosition.z), 0.4);

        // rotate camera around the Y position if right click is true
        if (this._input.right_click) {

            // ddaydd to implement
            //let rotationY = this.camera.rotation.y -= this._input.h;
            //this.camera.rotation = new Vector3(0, rotationY, 0);
        }
    }

}