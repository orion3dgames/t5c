import { TransformNode, Scene, Mesh, UniversalCamera, Vector3, MeshBuilder, Color3 } from "@babylonjs/core";
import { CustomMaterial } from "@babylonjs/materials";
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Button,Ellipse, Line } from "@babylonjs/gui";

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

    public playerNextPosition: Vector3;
    private isCurrentPlayer: boolean;
    public sessionId: string;

    public entity: any;
    public xPos: number;
    public yPos: number;
    public zPos: number;

    constructor(entity, isCurrentPlayer, sessionId, scene: Scene, input?) {
        super("player", scene);

        this.scene = scene;
        this.sessionId = sessionId; // network id from colyseus
        this.entity = entity;
        this.isCurrentPlayer = isCurrentPlayer;
        this._input = input;

        // spawn player
        this.spawn(entity);

    }

    // todo: this should a global utils
    addLabel(mesh, text) {

        // GUI
        var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
        var rect1 = new Rectangle();
        rect1.width = 0.2;
        rect1.height = "40px";
        rect1.cornerRadius = 20;
        rect1.color = "Orange";
        rect1.thickness = 4;
        rect1.background = "green";
        advancedTexture.addControl(rect1);
        rect1.linkWithMesh(mesh);   
        rect1.linkOffsetY = -150;
    
        var label = new TextBlock();
        label.text = text;
        rect1.addControl(label);
    
        var target = new Ellipse();
        target.width = "20px";
        target.height = "20px";
        target.color = "Orange";
        target.thickness = 4;
        target.background = "green";
        advancedTexture.addControl(target);
        target.linkWithMesh(mesh);   
    
        var line = new Line();
        line.lineWidth = 4;
        line.color = "Orange";
        line.y2 = 20;
        line.linkOffsetY = -10;
        advancedTexture.addControl(line);
        line.linkWithMesh(mesh); 
        line.connectedControl = rect1;   

    }

    private spawn(entity): void {
        
        // generate mesh
        const sphere = MeshBuilder.CreateSphere(`player-${this.sessionId}`, {
            segments: 8,
            diameter: 1
        }, this.scene);
      
        // set material to differentiate CURRENT player and OTHER players
        //let sphereMaterial = new CustomMaterial(`player-material-${this.sessionId}`);
        //sphereMaterial.emissiveColor = (this.isCurrentPlayer) ? Color3.FromHexString("#ff9900") : Color3.Gray();
        //sphere.material = sphereMaterial;

        // set initial position from server
        sphere.position.set(this.entity.xPos, this.entity.yPos, this.entity.zPos);
    
        // save entities
        this.playerNextPosition = sphere.position.clone();

        // set mesh
        this.mesh = sphere;
        this.mesh.parent = this;

        // add player nameplate
        this.addLabel(this.mesh, entity.username);
        
        // if myself, add all player related stuff
        if(this.isCurrentPlayer){
            this._setupPlayerCamera();
        }

        // entity network event
        this.entity.onChange(() => {
            console.log('entity.onChange', entity);
            this.playerNextPosition.set(this.entity.xPos, this.entity.yPos, this.entity.zPos);
        });

    }

    public processMove() {

        // prepare velocity
        let velocityX = 0
        let velocityZ = 0
        let velocityY = 0

        // create forces from input
        velocityX = this._input.horizontal;
        velocityZ = this._input.vertical;
        velocityY = 0; // jump or keep going down

        // add values
        this._moveDirection.x = velocityX;
        this._moveDirection.y = velocityY;
        this._moveDirection.z = velocityZ;

        console.log('processMove', this._input.horizontal, this._input.vertical, this._moveDirection);

        // do move
        this.move();
    }

    private move() {

        // update networked entity
        this.entity.xPos -= this._moveDirection.x * Player.PLAYER_SPEED;
        this.entity.zPos -= this._moveDirection.z * Player.PLAYER_SPEED;
        this.entity.yPos = 0;

        // update local player
        this.playerNextPosition.set(this.entity.xPos, this.entity.yPos, this.entity.zPos);
        
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
        this.camera = new UniversalCamera("cam", new Vector3(0, 0, -50), this.scene);
        this.camera.lockedTarget = this._camRoot.position;
        this.camera.fov = 0.47350045992678597;
        this.camera.parent = yTilt;

        this.scene.activeCamera = this.camera;
        console.log('_setupPlayerCamera', this.scene);
        return this.camera;
    }

}