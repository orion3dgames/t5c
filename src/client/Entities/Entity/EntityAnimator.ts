import { AnimationGroup, Vector3 } from "@babylonjs/core";
import { Entity } from "../Entity";
import { EntityState } from "../../../shared/types";

export class EntityAnimator {
    private _entity;

    //animations
    private _playerAnimations: AnimationGroup[];
    private _idle: AnimationGroup;
    private _walk: AnimationGroup;
    private _attack: AnimationGroup;
    private _death: AnimationGroup;
    private _damage: AnimationGroup;
    private _casting: AnimationGroup;
    private _cast: AnimationGroup;
    private _pickup: AnimationGroup;

    // current anim status
    private _currentAnim: AnimationGroup;
    private _prevAnim: AnimationGroup;

    constructor(player_animations, entity: Entity) {
        this._playerAnimations = player_animations;
        this._entity = entity;

        this._build();
    }

    private _build(): void {
        // find animations
        let idleAnimation = this._entity.animations["IDLE"];
        let walkAnimation = this._entity.animations["WALK"];
        let attackAnimation = this._entity.animations["ATTACK"];
        let deathAnimation = this._entity.animations["DEATH"];
        let takingDamageAnimation = this._entity.animations["DAMAGE"];
        let castingAnimation = this._entity.animations["CASTING"] ?? 0;
        let castingShootAnimation = this._entity.animations["CAST"] ?? 0;
        let pickupAnimation = this._entity.animations["PICKUP"] ?? 0;

        // find animations
        let idleAnimationNumber = idleAnimation.animation_id;
        let walkAnimationNumber = walkAnimation.animation_id;
        let attackAnimationNumber = attackAnimation.animation_id;
        let deathAnimationNumber = deathAnimation.animation_id;
        let takingDamageAnimationNumber = takingDamageAnimation.animation_id;
        let castingAnimationNumber = castingAnimation.animation_id;
        let castingShootAnimationNumber = castingShootAnimation.animation_id;
        let pickupAnimationNumber = pickupAnimation.animation_id;

        // set animations
        this._idle = this._playerAnimations[idleAnimationNumber];
        this._walk = this._playerAnimations[walkAnimationNumber];
        this._attack = this._playerAnimations[attackAnimationNumber];
        this._death = this._playerAnimations[deathAnimationNumber];
        this._damage = this._playerAnimations[takingDamageAnimationNumber];
        this._casting = this._playerAnimations[castingAnimationNumber];
        this._cast = this._playerAnimations[castingShootAnimationNumber];
        this._pickup = this._playerAnimations[pickupAnimationNumber];

        // stop all animations
        this._playerAnimations[0].stop();

        // set if animation is looped
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._attack.loopAnimation = true;
        this._death.loopAnimation = false;
        this._damage.loopAnimation = true;
        this._casting.loopAnimation = true;
        this._cast.loopAnimation = false;
        this._pickup.loopAnimation = false;

        // set animation speed
        this._walk.speedRatio = 1.5;
        this._attack.speedRatio = 1.1;
        this._cast.speedRatio = 2;
        this._pickup.speedRatio = 2;

        //initialize current and previous
        this._currentAnim = this._idle;
        this._prevAnim = this._walk;
    }

    //
    private checkIfPlayerIsMoving(currentPos: Vector3, nextPos: Vector3, epsilon = 0.05): boolean {
        return !currentPos.equalsWithEpsilon(nextPos, epsilon);
    }

    ///////////////////////////
    // todo: to be improved so we can better control the states... have no idea how yet
    public animate(player, currentPos, nextPos): void {
        // if position has changed

        if (this.checkIfPlayerIsMoving(currentPos, nextPos)) {
            //if (player.state === EntityCurrentState.WALKING) {
            this._currentAnim = this._walk;

            // if player has died
        } else if (player.anim_state === EntityState.DEAD) {
            this._currentAnim = this._death;

            // if player is attacking
        } else if (player.anim_state === EntityState.ATTACK) {
            this._currentAnim = this._attack;

            // if player is being attacked
        } else if (player.anim_state === EntityState.TAKING_DAMAGE) {
            this._currentAnim = this._damage;

            // if player is being attacked
        } else if (player.anim_state === EntityState.SPELL_CASTING) {
            // if player is castin
            this._currentAnim = this._casting;

            // if player launched a spell
        } else if (player.anim_state === EntityState.SPELL_CAST) {
            this._currentAnim = this._cast;

        // if player pickup
        } else if (player.anim_state === EntityState.PICKUP) {
            this._currentAnim = this._pickup;

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
