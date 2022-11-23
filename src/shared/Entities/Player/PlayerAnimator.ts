import { TransformNode, Scene, UniversalCamera, MeshBuilder,AxesViewer, Space,Vector3,Axis, AnimationGroup, SceneLoader, AbstractMesh, ActionManager, ExecuteCodeAction} from "@babylonjs/core";
import { Rectangle, TextBlock } from "@babylonjs/gui";
import { roundToTwo } from "../../Utils";

export class Player extends TransformNode {
    public camera;
    public scene: Scene;
    public _room;
    public ui;
    private _input;
    private _shadow;

    //Player
    public mesh: AbstractMesh; //outer collisionbox of player
    public characterLabel: Rectangle;

    //Camera
    private _camRoot: TransformNode;
    private _yTilt: TransformNode;

    //player movement vars
    private _deltaTime: number = 0;
    private _h: number;
    private _v: number;

    // animation trackers
    private playerAnimations: AnimationGroup[];
    private _currentAnim: AnimationGroup = null;
    private _prevAnim: AnimationGroup;

    //animations
    private _walk: AnimationGroup;
    private _idle: AnimationGroup;

    private isCurrentPlayer: boolean;
    public sessionId: string;
    public playerNextPosition: Vector3;

    constructor(result, scene) {
        super("playerAnimator", scene);

        this._scene = scene;
        this.playerAnimations = result.animationGroups;

        // find animations
        this._idle = this.playerAnimations.find(o => o.name === 'Hobbit_Idle');
        this._walk = this.playerAnimations.find(o => o.name === 'Hobbit_Walk');

        // prepare animations
        this._setUpAnimations();

        // render loop
        this.scene.registerBeforeRender(() => {
            this._animatePlayer();  
        });

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

        // if position has changed
        if (
            (
                roundToTwo(this.mesh.position.x) !== roundToTwo(this.playerNextPosition.x) ||
                roundToTwo(this.mesh.position.y) !== roundToTwo(this.playerNextPosition.y)
            )
        ) {
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

}