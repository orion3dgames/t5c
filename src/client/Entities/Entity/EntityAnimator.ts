import { AnimationGroup, Vector3 } from "@babylonjs/core";
import { Entity } from "../Entity";
import { EntityState } from "../../../shared/types";

export class EntityAnimator {
    private _entity;
    private playerMesh;
    private entityData;

    //animations
    private _playerAnimations: AnimationGroup[];
    private _idle;
    private _walk;
    private _attack;
    private _death;
    private _damage;
    private _casting;
    private _cast;
    private _pickup;

    // current anim status
    public _currentAnim;
    private _prevAnim;

    //
    public currentFrame: number = 0;
    public targetFrame: number = 0;
    public endOfLoop: boolean = false;

    constructor(entity: Entity) {
        // get player mesh
        this.playerMesh = entity.meshController.playerMesh;

        // set default vat animation
        this.entityData = entity._game._vatController.entityData.get(entity.race);

        this._entity = entity;

        this._build();
    }

    private _build(): void {
        this._idle = {
            index: 0,
            loop: true,
            speed: 1,
            ranges: this.entityData.animationRanges[0],
        };

        this._walk = {
            index: 1,
            loop: true,
            speed: 1,
            ranges: this.entityData.animationRanges[1],
        };

        this._attack = {
            index: 2,
            loop: true,
            speed: 1,
            ranges: this.entityData.animationRanges[2],
        };

        this._death = {
            index: 3,
            loop: false,
            speed: 1,
            ranges: this.entityData.animationRanges[3],
        };
    }

    private setAnimationParameters(vec, currentAnim, delta = 60) {
        let animIndex = currentAnim.index ?? 0;
        const anim = this.entityData.animationRanges[animIndex];
        const from = Math.floor(anim.from);
        const to = Math.floor(anim.to);
        const ofst = 0;
        vec.set(from, to - 1, ofst, delta); // skip one frame to avoid weird artifacts

        //
        this.currentFrame = from;
        this.targetFrame = to - 1;
    }

    //
    private checkIfPlayerIsMoving(currentPos: Vector3, nextPos: Vector3, epsilon = 0.05): boolean {
        return !currentPos.equalsWithEpsilon(nextPos, epsilon);
    }

    ///////////////////////////
    // todo: to be improved so we can better control the states... have no idea how yet
    public animate(player, delta): void {
        let currentPos = player.mesh.position;
        let nextPos = player.moveController.getNextPosition();
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
            this._currentAnim = this._death;
        }

        // play animation and stop previous animation
        if (this._currentAnim != null && this._prevAnim !== this._currentAnim) {
            console.log("CHANGE ANIMATION TO", this._currentAnim);
            this.setAnimationParameters(this.playerMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced, this._currentAnim, delta);
            this._prevAnim = this._currentAnim;
            this.endOfLoop = false;
        }

        // if animation is loop=false;
        if (this.currentFrame === this.targetFrame && this._currentAnim.loop === false && this.endOfLoop === false) {
            console.log("ANIMATION FINISHED, STOP ANIMATION ", this.currentFrame, this.targetFrame);
            this.playerMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced.set(this.targetFrame, this.targetFrame, 0, 0);
            this.endOfLoop = true;
        } else {
            this.currentFrame++;
        }
    }
}
