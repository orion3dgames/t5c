import { AnimationGroup } from "@babylonjs/core";
import { Vector3 } from "babylonjs";
import { distanceBetween } from "../../Utils";
import { PlayerCurrentState } from "./PlayerCurrentState";

export class PlayerAnimator {

    //animations
    private _playerAnimations: AnimationGroup[];
    private _idle: AnimationGroup;
    private _walk: AnimationGroup;
    private _death: AnimationGroup;

    // current anim status
    private _currentAnim: AnimationGroup = null;
    private _prevAnim: AnimationGroup;

    // case 
    private _state:string;

    constructor(player_animations: AnimationGroup[]) {

        this._playerAnimations = player_animations;

        this._build();
    }

    private _build(): void {

        // find animations
        this._idle = this._playerAnimations.find(o => o.name === 'Hobbit_Idle');
        this._walk = this._playerAnimations.find(o => o.name === 'Hobbit_Walk');
        this._death = this._playerAnimations.find(o => o.name === 'Hobbit_Death');

        // prepare animations
        //this._scene.stopAllAnimations();
        this._playerAnimations[0].stop();

        //
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._death.loopAnimation = false;

        //initialize current and previous
        this._currentAnim = this._idle;
        this._prevAnim = this._walk;

    }

    // 
    private checkIfPlayerIsMoving(currentPos:Vector3, nextPos:Vector3, precision = 3):boolean{
        return !currentPos.equalsWithEpsilon(nextPos);
        /*
        return  currentPos.x.toFixed(precision) !== nextPos.x.toFixed(precision) || 
                currentPos.z.toFixed(precision) !== nextPos.z.toFixed(precision)*/
    }

    ///////////////////////////
    // todo: to be improved so we can better control the states... have no idea how yet
    public animate(player, currentPos, nextPos): void {

        console.log('CHECK IF SOURCE AND DESTINATION ARE THE SAME', this.checkIfPlayerIsMoving(currentPos, nextPos));

        // if player has died
        if(player.state === PlayerCurrentState.DEAD){
            this._currentAnim = this._death;

        // if position has changed
        }else if (this.checkIfPlayerIsMoving(currentPos, nextPos)) {
            this._currentAnim = this._walk;

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