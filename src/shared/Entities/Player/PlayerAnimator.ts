import { AnimationGroup } from "@babylonjs/core";
import { Vector3 } from "babylonjs";
import Config from "../../Config";
import { distanceBetween } from "../../Utils";
import { PlayerCurrentState } from "./PlayerCurrentState";

export class PlayerAnimator {

    private entityType;

    //animations
    private _playerAnimations: AnimationGroup[];
    private _idle: AnimationGroup;
    private _walk: AnimationGroup;
    private _attack: AnimationGroup;
    private _death: AnimationGroup;

    // current anim status
    private _currentAnim: AnimationGroup = null;
    private _prevAnim: AnimationGroup;

    // case 
    private _state:string;

    constructor(player_animations: AnimationGroup[], entityType) {

        this._playerAnimations = player_animations;
        this.entityType = entityType;

        this._build();
    }

    private _build(): void {

        // find animations
        //this._idle = this._playerAnimations.find(o => o.name === 'Hobbit_Idle');
        //this._walk = this._playerAnimations.find(o => o.name === 'Hobbit_Walk');
        //this._death = this._playerAnimations.find(o => o.name === 'Hobbit_Death');

        let idleAnimationNumber = Config.entities[this.entityType].animations['IDLE'];
        let walkAnimationNumber = Config.entities[this.entityType].animations['WALK'];
        let attackAnimationNumber = Config.entities[this.entityType].animations['ATTACK'];
        let deathAnimationNumber = Config.entities[this.entityType].animations['DEATH'];

        this._idle = this._playerAnimations[idleAnimationNumber];
        this._walk = this._playerAnimations[walkAnimationNumber];
        this._attack = this._playerAnimations[attackAnimationNumber];
        this._death = this._playerAnimations[deathAnimationNumber];

        // prepare animations
        //this._scene.stopAllAnimations();
        this._playerAnimations[0].stop();

        //
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._attack.loopAnimation = false;
        this._death.loopAnimation = false;

        //initialize current and previous
        this._currentAnim = this._idle;
        this._prevAnim = this._idle;

    }

    // 
    private checkIfPlayerIsMoving(currentPos:Vector3, nextPos:Vector3, precision = 5):boolean{
        return !currentPos.equalsWithEpsilon(nextPos, 0.001);
        /*
        return  currentPos.x.toFixed(precision) !== nextPos.x.toFixed(precision) || 
                currentPos.z.toFixed(precision) !== nextPos.z.toFixed(precision)*/
    }

    ///////////////////////////
    // todo: to be improved so we can better control the states... have no idea how yet
    public animate(player, currentPos, nextPos): void {

        // if position has changed
        if (this.checkIfPlayerIsMoving(currentPos, nextPos)) {
            //console.log('SAME', player.type, currentPos, nextPos, this.checkIfPlayerIsMoving(currentPos, nextPos));
            this._currentAnim = this._walk;

        // if player has died
        }else if(player.state === PlayerCurrentState.DEAD){
            
            this._currentAnim = this._death;

        // if player is attacking
        }else if(player.state === PlayerCurrentState.ATTACK){
                    
            this._currentAnim = this._attack;

        // all other cases, should be idle    
        } else {
            this._currentAnim = this._idle;
        }

        //
        if (this._currentAnim != null && this._prevAnim !== this._currentAnim) {
            this._prevAnim.stop();
            this._currentAnim.play(this._currentAnim.loopAnimation);
            this._prevAnim = this._currentAnim;
        }
    }

}