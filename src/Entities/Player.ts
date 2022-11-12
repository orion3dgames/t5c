import { TransformNode, Scene, UniversalCamera, Vector3, AnimationGroup, SceneLoader, AbstractMesh } from "@babylonjs/core";
import { Rectangle, TextBlock } from "@babylonjs/gui";

export class Player extends TransformNode {
    public camera;
    public scene: Scene;
    public ui;
    private _input;
    private _shadow;

    //Player
    public mesh: AbstractMesh; //outer collisionbox of player

    //Camera
    private _camRoot: TransformNode;
    private _yTilt: TransformNode;

    //const values
    private static readonly PLAYER_SPEED: number = 0.12;
    private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0.5934119456780721, 0, 0);

    //player movement vars
    private _deltaTime: number = 0;
    private _h: number;
    private _v: number;

    // animation trackers
    private _currentAnim: AnimationGroup = null;
    private _prevAnim: AnimationGroup;

    //animations
    private _walk: AnimationGroup;
    private _idle: AnimationGroup;

    public playerPosition: Vector3;
    public playerDirection: Vector3;
    public playerNextPosition: Vector3;
    public playerNextRotation: Vector3;
    public playerMove: any;

    private isCurrentPlayer: boolean;
    public sessionId: string;

    public entity: any;
    public x: number;
    public y: number;
    public z: number;
    public rot: number;

    constructor(entity, isCurrentPlayer, sessionId, scene: Scene, _ui, input, _shadow) {
        super("player", scene);

        this.scene = scene;
        this.ui = _ui;
        this._shadow = _shadow;
        this.sessionId = sessionId; // network id from colyseus
        this.entity = entity;
        this.isCurrentPlayer = isCurrentPlayer;
        this._input = input;

        // spawn player
        this.spawn(entity);
    }

    // todo: this should a global utils
    private addLabel(mesh, text) {

        var rect1 = new Rectangle();
        rect1.width = "100px";
        rect1.height = "40px";
        rect1.cornerRadius = 20;
        rect1.color = "white";
        rect1.thickness = 4;
        rect1.background = "black";
        this.ui._playerUI.addControl(rect1);
        rect1.linkWithMesh(mesh);
        rect1.linkOffsetY = -150;

        var label = new TextBlock();
        label.text = text;
        rect1.addControl(label);

    }

    private async spawn(entity) {
        
        console.log(entity);

        // load mesh
        const result = await SceneLoader.ImportMeshAsync(null, "./models/", "player_fixed.glb", this._scene);
        const playerMesh = result.meshes[0];

        // add shadows
        this._shadow.addShadowCaster(playerMesh, true);
        playerMesh.receiveShadows = true;

        // set initial scale 
        playerMesh.scaling.set(0.04, 0.04, 0.04);

        // save entities
        this.playerNextPosition = new Vector3(this.entity.x, this.entity.y, this.entity.z);
        this.playerNextRotation = new Vector3(0,this.entity.rot,0);

        // hide mesh (DEBUG)
        //playerMesh.setEnabled(false);

        // set mesh
        this.mesh = playerMesh;
        this.mesh.parent = this;

        // add player nameplate
        this.addLabel(this.mesh, entity.username);

        // find animations
        this._idle = this._scene.getAnimationGroupByName("Hobbit_Idle");
        this._walk = this._scene.getAnimationGroupByName("Hobbit_Walk");

        // prepare animations
        this._setUpAnimations();

        // if myself, add all player related stuff
        if (this.isCurrentPlayer) {
            this._setupPlayerCamera();
            this.activatePlayerCamera();
        }

        ///////////////////////////////////////////////////////////
        // entity network event
        // Colyseus automatically updates entity variables, so let's listen to any changes
        this.entity.onChange(() => {
            if(!this.isCurrentPlayer) {
                console.log('onChange', this.entity)
                this.playerNextPosition = new Vector3(this.entity.x, this.entity.y, this.entity.z);
                this.playerNextRotation = new Vector3(0,this.entity.rot,0);
            }
        });
    }
    
    public processMove() {

        // prepare velocity
        let velocityX = 0
        let velocityZ = 0
        let velocityY = 0

        // this should work // model needs to be rotated I think // ask dayd :), EDIT : yes, you were not far ;)
        let rotationY = Math.atan2(this._input.horizontal, this._input.vertical);

        // create forces from input
        velocityX = this._input.horizontal;
        velocityZ = this._input.vertical;
        velocityY = 0; // jump or keep going down

        // add values
        this.playerMove = {};
        this.playerMove.x = velocityX;
        this.playerMove.y = velocityY;
        this.playerMove.z = velocityZ;
        this.playerMove.rot = rotationY;

        console.log('processMove', this.playerMove);

        // do move
        this.move();
    }

    private move() {

        
        /*
        this.entity.xPos -= this._moveDirection.x * Player.PLAYER_SPEED;
        this.entity.zPos -= this._moveDirection.z * Player.PLAYER_SPEED;
        this.entity.yPos = 0;
        */

        // update local entity
        this.playerNextPosition.x -= this.playerMove.x * Player.PLAYER_SPEED;
        this.playerNextPosition.z -= this.playerMove.z * Player.PLAYER_SPEED;
        this.playerNextRotation.y = this.playerMove.rot;

        // update networked entity
        this.entity.x = this.playerNextPosition.x;
        this.entity.z = this.playerNextPosition.z;
        this.entity.rot = this.playerNextRotation.y;

    }

    private _setUpAnimations(): void {

        this.scene.stopAllAnimations();

        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;

        //initialize current and previous
        this._currentAnim = this._idle;
        this._prevAnim = this._walk;
    }

    private _animatePlayer(): void {

        if ((this._input.moving)) {
            this._currentAnim = this._walk;
        } else {
            this._currentAnim = this._idle;
        }

        if (this._currentAnim != null && this._prevAnim !== this._currentAnim) {
            this._prevAnim.stop();
            this._currentAnim.play(this._currentAnim.loopAnimation);
            this._prevAnim = this._currentAnim;
        }
    }


    public activatePlayerCamera(): UniversalCamera {
        this.scene.registerBeforeRender(() => {
            this._animatePlayer();
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
        return this.camera;
    }

}