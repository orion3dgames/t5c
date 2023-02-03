import { AnimationGroup, Vector3 } from "@babylonjs/core";
import { EntityCurrentState } from "./EntityCurrentState";
import Config from "../../Config";
import Races from "../../../shared/Data/Races";

export class EntityAnimator {
    private entityType;

    //animations
    private _playerAnimations: AnimationGroup[];
    private _idle: AnimationGroup;
    private _walk: AnimationGroup;
    private _attack: AnimationGroup;
    private _death: AnimationGroup;
    private _damage: AnimationGroup;

    // current anim status
    private _currentAnim: AnimationGroup = null;
    private _prevAnim: AnimationGroup;

    constructor(player_animations: AnimationGroup[], entityType) {
        this._playerAnimations = player_animations;
        this.entityType = entityType;

        this._build();
    }

    private _build(): void {
        let raceData = Races[this.entityType];

        // find animations
        let idleAnimationNumber = raceData.animations["IDLE"];
        let walkAnimationNumber = raceData.animations["WALK"];
        let attackAnimationNumber = raceData.animations["ATTACK"];
        let deathAnimationNumber = raceData.animations["DEATH"];
        let takingDamageAnimationNumber = raceData.animations["DAMAGE"];

        // set animations
        this._idle = this._playerAnimations[idleAnimationNumber];
        this._walk = this._playerAnimations[walkAnimationNumber];
        this._attack = this._playerAnimations[attackAnimationNumber];
        this._death = this._playerAnimations[deathAnimationNumber];
        this._damage = this._playerAnimations[takingDamageAnimationNumber];

        // stop all animations
        this._playerAnimations[0].stop();

        // set if animation is looped
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._attack.loopAnimation = true;
        this._death.loopAnimation = false;
        this._damage.loopAnimation = true;

        // set animation speed
        this._walk.speedRatio = raceData.animationSpeed;

        //initialize current and previous
        this._currentAnim = this._idle;
        this._prevAnim = this._idle;
    }

    //
    private checkIfPlayerIsMoving(currentPos: Vector3, nextPos: Vector3, epsilon = 0.001): boolean {
        return !currentPos.equalsWithEpsilon(nextPos, epsilon);
    }

    ///////////////////////////
    // todo: to be improved so we can better control the states... have no idea how yet
    public animate(player, currentPos, nextPos): void {
        // if position has changed
        if (this.checkIfPlayerIsMoving(currentPos, nextPos)) {
            this._currentAnim = this._walk;

            // if player has died
        } else if (player.state === EntityCurrentState.DEAD) {
            this._currentAnim = this._death;

            // if player is attacking
        } else if (player.state === EntityCurrentState.ATTACK) {
            this._currentAnim = this._attack;

            // if player is being attacked
        } else if (player.state === EntityCurrentState.TAKING_DAMAGE) {
            this._currentAnim = this._damage;

            // all other cases, should be idle
        } else {
            this._currentAnim = this._idle;
        }

        // play animation and stop previous animation
        if (this._currentAnim != null && this._prevAnim !== this._currentAnim) {
            this._prevAnim.stop();
            this._currentAnim.play(this._currentAnim.loopAnimation);
            this._prevAnim = this._currentAnim;
        }
    }
}
