import { AnimationGroup } from "@babylonjs/core";
import { Vector3 } from "babylonjs";
import { roundToTwo, roundTo } from "../../Utils";

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

    public animate(player, currentPos, nextPos): void {

        const precision = 2;
        // if position has changed
        if(player.health < 1){
            this._currentAnim = this._death;
            console.log('DEAD')
        }else if (currentPos.x.toFixed(precision) !== nextPos.x.toFixed(precision) || currentPos.z.toFixed(precision) !== nextPos.z.toFixed(precision)) {
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