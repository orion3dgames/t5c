import { AnimationGroup } from "@babylonjs/core";
import { Vector3 } from "babylonjs";
import { roundToTwo, roundTo } from "../../Utils";

export class PlayerAnimator {

    //animations
    private _playerAnimations: AnimationGroup[];
    private _idle: AnimationGroup;
    private _walk: AnimationGroup;

    // current anim status
    private _currentAnim: AnimationGroup = null;
    private _prevAnim: AnimationGroup;

    constructor(player_animations: AnimationGroup[]) {

        this._playerAnimations = player_animations;

        this._build();
    }

    private _build(): void {

        // find animations
        this._idle = this._playerAnimations.find(o => o.name === 'Hobbit_Idle');
        this._walk = this._playerAnimations.find(o => o.name === 'Hobbit_Walk');

        // prepare animations
        //this._scene.stopAllAnimations();
        this._playerAnimations[0].stop();

        //
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;

        //initialize current and previous
        this._currentAnim = this._idle;
        this._prevAnim = this._walk;

    }

    public animate(currentPos, nextPos): void {

        const precision = 2;
        // if position has changed
        if (currentPos.x.toFixed(precision) !== nextPos.x.toFixed(precision) || currentPos.z.toFixed(precision) !== nextPos.z.toFixed(precision)) {
            this._currentAnim = this._walk;
            // console.log(nextPos.x.toFixed(precision) - currentPos.x.toFixed(precision), nextPos.z.toFixed(precision) - currentPos.z.toFixed(precision))
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