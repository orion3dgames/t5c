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
        /////////// essential animations
        // find animations
        let idleAnimation = this._entity.animations["IDLE"] ?? 0;
        let walkAnimation = this._entity.animations["WALK"] ?? 0;
        let attackAnimation = this._entity.animations["ATTACK"] ?? 0;
        let deathAnimation = this._entity.animations["DEATH"] ?? 0;

        // find animations
        let idleAnimationNumber = idleAnimation.animation_id;
        let walkAnimationNumber = walkAnimation.animation_id;
        let attackAnimationNumber = attackAnimation.animation_id;
        let deathAnimationNumber = deathAnimation.animation_id;

        // set animations
        this._idle = this._playerAnimations[idleAnimationNumber];
        this._walk = this._playerAnimations[walkAnimationNumber];
        this._attack = this._playerAnimations[attackAnimationNumber];
        this._death = this._playerAnimations[deathAnimationNumber];

        // set if animation is looped
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._attack.loopAnimation = true;
        this._death.loopAnimation = false;

        // set animation speed
        this._idle.speedRatio = idleAnimation.speed;
        this._walk.speedRatio = walkAnimation.speed;
        this._attack.speedRatio = attackAnimation.speed;
        this._death.speedRatio = deathAnimation.speed;

        //////////// optional animations
        //
        let takingDamageAnimation = this._entity.animations["DAMAGE"] ?? false;
        if (takingDamageAnimation) {
            let takingDamageAnimationNumber = takingDamageAnimation.animation_id ?? 0;
            this._damage = this._playerAnimations[takingDamageAnimationNumber];
            this._damage.loopAnimation = true;
            this._damage.speedRatio = takingDamageAnimation.speed;
        }

        let castingAnimation = this._entity.animations["CASTING"] ?? false;
        if (castingAnimation) {
            let castingAnimationNumber = castingAnimation.animation_id ?? 0;
            this._casting = this._playerAnimations[castingAnimationNumber];
            this._casting.loopAnimation = true;
            this._casting.speedRatio = castingAnimation.speed;
        }

        let castingShootAnimation = this._entity.animations["CAST"] ?? false;
        if (castingShootAnimation) {
            let castingShootAnimationNumber = castingShootAnimation.animation_id ?? 0;
            this._cast = this._playerAnimations[castingShootAnimationNumber];
            this._cast.loopAnimation = false;
            this._cast.speedRatio = castingShootAnimation.speed;
        }

        let pickupAnimation = this._entity.animations["PICKUP"] ?? false;
        if (pickupAnimation) {
            let pickupAnimationNumber = pickupAnimation.animation_id ?? 0;
            this._pickup = this._playerAnimations[pickupAnimationNumber];
            this._pickup.loopAnimation = false;
            this._pickup.speedRatio = pickupAnimation.speed;
        }

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
        player.isMoving = false;

        // if player is moving
        // note to myself: when a players dies, the below still considers the player is moving... to be improved.
        if (this.checkIfPlayerIsMoving(currentPos, nextPos) && player.health > 0) {
            this._currentAnim = this._walk;
            player.isMoving = true;

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
