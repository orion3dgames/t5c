import nengi from 'nengi'

import { Mesh, MeshBuilder, UniversalCamera, Vector3, TransformNode, Scene } from "@babylonjs/core";
import { CustomMaterial } from "@babylonjs/materials";

class PlayerCharacter {

    public camera: UniversalCamera;
    public scene: Scene;
    private _input;

    //Camera
    private _camRoot: TransformNode;
    private _yTilt: TransformNode;

    //const values
    private static readonly PLAYER_SPEED: number = 0.45;
    private static readonly JUMP_FORCE: number = 0.80;
    private static readonly GRAVITY: number = -2.8;
    private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0.5934119456780721, 0, 0);

    public nid = 0; // nengi id
    private player_uid = false // firebase id
    public mesh: Mesh;
    public x = 0
    public y = 0
    public z = 0
    private color = '#FFFFFF';
    private speed = 2;
    public displayName = '...loading';
    private savingToDB = false;
    private lastSaved = new Date().getTime();

    private moveDirection = {};
    private moveRotation = 0;
    private position = new Vector3;
    private rotation = new Vector3;
    
    static protocol: {};
    public client: any;

    constructor(entity) {

        if (entity) {
            Object.assign(this, entity)
        }

        this.moveRotation = 0;
        this.moveDirection = {
            x: 0,
            y: 0,
            z: 0,
        }

        this.position.set(this.x, this.y, this.z);
    
        this.rotation.set(0, entity.rotation, 0);

        console.log(this);
    }

    spawn(targetEl, entity, myId) {

        /*
        var entityEl = document.createElement('a-entity');
        entityEl.setAttribute('id', 'nid-' + this.nid);
        entityEl.setAttribute('position', this.position);
        entityEl.setAttribute('rotation', this.rotation);
        entityEl.setAttribute('material', this.material);
        entityEl.setAttribute('geometry', this.geometry);
        entityEl.setAttribute('shadow', this.geometry);
        */

        // create box
        const cube = MeshBuilder.CreateBox(`cube`, {}, targetEl)

        // set initial position from server
        cube.position.set(this.position.x, this.position.y, this.position.z);

        this.mesh = cube;

        // add username
        /*
        var nameEl = document.createElement('a-text');
        nameEl.setAttribute('text', 'color: #000; align: left; value: ' + this.displayName + "\n" + this.nid + '; width: 2; side: double');
        nameEl.setAttribute('position', { x: -0.5, y: 1.25, z: 0 });
        entityEl.appendChild(nameEl);*/

        // if myself, add all player related stuff
        if (entity.nid === myId) {

            /*
            // add player specific component
            entityEl.setAttribute('player-body', ''); // uniquement sur le joueur?

            // add cursor
            // info: https://aframe.io/docs/1.3.0/components/cursor.html
            var cursorEl = document.createElement('a-entity');
            cursorEl.setAttribute('intersection-spawn', '');
            cursorEl.setAttribute('cursor', {
                rayOrigin: 'mouse', // good for dev on keyboard and mouse, maybe we can toggle this on or off depending on device
                //upEvents: ['mousedown', 'triggerdown'],
                //downEvents: ['mouseup', 'triggerup'],
            });
            cursorEl.setAttribute('raycaster', {
                far: 20, // 10m max
                interval: 100, // every 1/2 second
                objects: '.cube'
            });

            // add camera to entity
            var cameraEl = document.createElement('a-entity');
            cameraEl.setAttribute('id', 'camera');
            cameraEl.setAttribute('camera', 'active', true);
            cameraEl.setAttribute('position', { x: 0, y: 1, z: 0 });
            cameraEl.setAttribute('player-head', '');
            //cameraEl.setAttribute('mouse-cursor', '');
            cameraEl.setAttribute('look-controls', {
                'enabled': true,
                'pointerLockEnabled': false
            });
            cameraEl.appendChild(cursorEl);
            entityEl.appendChild(cameraEl);

            // add left hand
            var leftHand = document.createElement('a-entity');
            leftHand.setAttribute('oculus-touch-controls', { 'hand': 'left' });
            leftHand.setAttribute('thumbstick-logging', '');
            entityEl.appendChild(leftHand);

            // add right hand
            var rightHand = document.createElement('a-entity');
            rightHand.setAttribute('oculus-touch-controls', { 'hand': 'right' });
            rightHand.setAttribute('thumbstick-logging', '');
            entityEl.appendChild(rightHand);
            */
        }

        return cube;
    }

    processMove(command) {

        /*
        let velocityX = 0
        let velocityZ = 0
        let velocityY = 0

        // create forces from input
        velocityZ = command.backward - command.forward
        velocityX = command.right - command.left
        velocityY = command.jump ? 3 : -0.001 ; // jump or keep going down

        // add values
        this.moveDirection.x = velocityZ * Math.sin(command.rotation / 180 * Math.PI * 2) + velocityX * Math.cos((-command.rotation / 180 * Math.PI * 2));
        this.moveDirection.z = velocityZ * Math.cos(command.rotation / 180 * Math.PI * 2) + velocityX * Math.sin((-command.rotation / 180 * Math.PI * 2));
        this.moveDirection.y = velocityY
        this.moveRotation = command.rotation

        // DONT GO BELOW GROUND
        if (velocityY < 1) {
            //this.y = 0;
            //this.moveDirection.y = 0
        }
        */

        //console.log(command, velocityZ, velocityX, velocityY);
    }

    move(delta) {
        /*
        this.x += this.moveDirection.x * this.speed * delta
        this.z += this.moveDirection.z * this.speed * delta
        this.y += this.moveDirection.y * this.speed * delta;
        this.rotation = this.moveRotation;
        */
    }

    private _updateCamera(): void {
        let centerPlayer = this.mesh.position.y + 2;
        this._camRoot.position = Vector3.Lerp(this._camRoot.position, new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z), 0.4);
    }

    private _setupPlayerCamera() {
        //root camera parent that handles positioning of the camera to follow the player
        this._camRoot = new TransformNode("root");
        this._camRoot.position = new Vector3(0, 0, 0); //initialized at (0,0,0)
        //to face the player from behind (180 degrees)
        this._camRoot.rotation = new Vector3(0, Math.PI, 0);

        //rotations along the x-axis (up/down tilting)
        let yTilt = new TransformNode("ytilt");
        //adjustments to camera view to point down at our player
        yTilt.rotation = PlayerCharacter.ORIGINAL_TILT;
        this._yTilt = yTilt;
        yTilt.parent = this._camRoot;

        //our actual camera that's pointing at our root's position
        this.camera = new UniversalCamera("cam", new Vector3(0, 0, -300), this.scene);
        this.camera.lockedTarget = this._camRoot.position;
        this.camera.fov = 0.47350045992678597;
        this.camera.parent = yTilt;

        this.scene.activeCamera = this.camera;
        return this.camera;
    }

}

// list of all vars to keep sync with all clients
PlayerCharacter.protocol = {
    x: { type: nengi.Float32, interp: true },
    y: { type: nengi.Float32, interp: true },
    z: { type: nengi.Float32, interp: true },
    rotation: { type: nengi.Float32, interp: true }, // should we use nengi.RotationFloat32 as suggested by DOC ?
    color: nengi.UTF8String,
    displayName: nengi.UTF8String,
    player_uid: nengi.UTF8String,
}

export default PlayerCharacter
