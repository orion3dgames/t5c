import { TransformNode, Scene, Mesh, UniversalCamera, Vector3, MeshBuilder, Color3 } from "@babylonjs/core";
import { CustomMaterial } from "@babylonjs/materials";

export class Player extends TransformNode {
    public camera;
    public scene: Scene;
    private _input;

    //Player
    public mesh: Mesh; //outer collisionbox of player
    
    //Camera
    private _camRoot: TransformNode;
    private _yTilt: TransformNode;

    //const values
    private static readonly PLAYER_SPEED: number = 0.45;
    private static readonly JUMP_FORCE: number = 0.80;
    private static readonly GRAVITY: number = -2.8;
    private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0.5934119456780721, 0, 0);

    //player movement vars
    private _deltaTime: number = 0;
    private _h: number;
    private _v: number;
 
    private _moveDirection: Vector3 = new Vector3();
    private _inputAmt: number;
    private _jumpCount: number;

    //gravity, ground detection, jumping
    private _gravity: Vector3 = new Vector3();
    private _lastGroundPos: Vector3 = Vector3.Zero(); // keep track of the last grounded position
    private _grounded: boolean;

    public playerNextPosition: { [playerId: string]: Vector3 } = {};
    private isCurrentPlayer: boolean;
    private sessionId: string;

    private entity: {};
    private xPos: 0;
    private yPos: 0;
    private zPos: 0;

    constructor(entity, isCurrentPlayer, sessionId, scene: Scene, input?) {
        super("player", scene);

        this.scene = scene;
        this.sessionId = sessionId; // network id from colyseus
        this.entity = entity;
        this.isCurrentPlayer = isCurrentPlayer;

        this.xPos = 0
        this.yPos = 0
        this.zPos = 0

        // spawn player
        this.spawn(this.entity, input);

    }

    private spawn(entity, input): void {
        
        // generate mesh
        const sphere = MeshBuilder.CreateSphere(`player-${this.sessionId}`, {
            segments: 8,
            diameter: 4
        }, this.scene);
      
        // set material to differentiate CURRENT player and OTHER players
        let sphereMaterial = new CustomMaterial(`player-material-${this.sessionId}`);
        sphereMaterial.emissiveColor = (this.isCurrentPlayer) ? Color3.FromHexString("#ff9900") : Color3.Gray();
        sphere.material = sphereMaterial;

        // set initial position from server
        sphere.position.set(entity.xPos, entity.yPos, entity.zPos);
    
        // save entities
        this.playerNextPosition[this.sessionId] = sphere.position.clone();

        // set mesh
        this.mesh = sphere;
        this.mesh.parent = this;
        
        // if myself, add all player related stuff
        if(this.isCurrentPlayer){
            this._input = input;
            this._setupPlayerCamera();
        }

        // init events
        entity.onChange(() => {
            this.playerNextPosition[this.sessionId].set(entity.xPos, entity.yPos, entity.zPos);
        });
        

    }

    private _initEvents() {

    }

    private processMove(command) {

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

        // DONT GO BELOW GROUND
        if (velocityY < 1) {
            //this.y = 0;
            //this.moveDirection.y = 0
        }

        //console.log(command, velocityZ, velocityX, velocityY);
        */
    }

    private move(delta) {
        /*
        this.x += this.moveDirection.x * this.speed * delta
        this.z += this.moveDirection.z * this.speed * delta
        this.y += this.moveDirection.y * this.speed * delta;
        */
    }

    public activatePlayerCamera(): UniversalCamera {
        this.scene.registerBeforeRender(() => {
            this._updateCamera();
    
        })
        return this.camera;
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
        yTilt.rotation = Player.ORIGINAL_TILT;
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