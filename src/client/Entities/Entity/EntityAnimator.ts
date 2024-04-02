import { AnimationGroup, Vector3 } from "@babylonjs/core";
import { Entity } from "../Entity";
import { EntityState } from "../../../shared/types";

export class EntityAnimator {
    private _entity;
    private mesh;
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
    private _nextAnim;

    //
    public currentFrame: number = 0;
    public targetFrame: number = 0;
    public endOfLoop: boolean = false;

    //
    _currentAnimVATTimeAtStart;
    toFrame;
    fromFrame;
    _currentAnimVATOffset;

    currentAnimationRange = 0;
    currentAnimationIndex = 0;

    constructor(entity: Entity) {
        // get player mesh
        this.mesh = entity.meshController.mesh;

        // set default vat animation
        this.entityData = entity._game._vatController.entityData.get(entity.race);

        this._entity = entity;
        this.ratio = entity._scene.getAnimationRatio();

        this._build();
    }

    public refresh() {
        this.ratio = this._entity._scene.getAnimationRatio();
        // set animation speed
        this._idle.speedRatio = this._entity.animations["IDLE"].speed * this.ratio;
        this._walk.speedRatio = this._entity.animations["WALK"].speed * this.ratio;
        this._attack.speedRatio = this._entity.animations["ATTACK"].speed * this.ratio;
        this._death.speedRatio = this._entity.animations["DEATH"].speed * this.ratio;
    }

    private _build(): void {
        this._attack = {
            index: 0,
            loop: true,
            speed: 1,
            ranges: this.entityData.animationRanges[0],
        };

        this._death = {
            index: 1,
            loop: false,
            speed: 1,
            ranges: this.entityData.animationRanges[1],
        };

        this._idle = {
            index: 2,
            loop: true,
            speed: 1,
            ranges: this.entityData.animationRanges[2],
        };

        this._walk = {
            index: 3,
            loop: true,
            speed: 1,
            ranges: this.entityData.animationRanges[3],
        };

        this._currentAnim = this._idle;
        this._prevAnim = this._death;
    }

    // This method will compute the VAT offset to use so that the animation starts at frame #0 for VAT time = time passed as 3rd parameter
    computeOffsetInAnim(fromFrame, toFrame, time, fps = 60) {
        const totalFrames = toFrame - fromFrame + 1;
        const t = (time * fps) / totalFrames;
        const frame = Math.floor((t - Math.floor(t)) * totalFrames);

        return totalFrames - frame;
    }

    private setAnimationParameters(vec, currentAnim, delta = 60) {
        const animIndex = currentAnim.index ?? 0;
        const anim = this.entityData.animationRanges[animIndex];

        const from = Math.floor(anim.from);
        const to = Math.floor(anim.to);

        this.fromFrame = from;
        this.toFrame = to - 1;

        this._currentAnimVATTimeAtStart = this.entityData.vat.time;
        this._currentAnimVATOffset = this.computeOffsetInAnim(this.fromFrame, this.toFrame, this._currentAnimVATTimeAtStart, delta);

        vec.set(this.fromFrame, this.toFrame, this._currentAnimVATOffset, delta); // skip one frame to avoid weird artifacts
    }

    //
    private checkIfPlayerIsMoving(currentPos: Vector3, nextPos: Vector3, epsilon = 0.05): boolean {
        return !currentPos.equalsWithEpsilon(nextPos, epsilon);
    }

    // determine what animation should be played
    public animate(player): void {
        let currentPos = player.position;
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

            // else play idle
        } else {
            this._currentAnim = this._idle;
        }
    }

    // play animation
    play(player) {
        // play animation and stop previous animation
        if (this._currentAnim != null && this._prevAnim !== this._currentAnim) {
            //console.log("CHANGE ANIMATION TO", this._currentAnim);
            this.setAnimationParameters(this.mesh.instancedBuffers.bakedVertexAnimationSettingsInstanced, this._currentAnim);
            player.meshController.equipments.forEach((itemMesh) => {
                //console.log("EQUIPEMENT CHANGE ANIMATION TO", this._currentAnim);
                this.setAnimationParameters(itemMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced, this._currentAnim);
            });
            this._prevAnim = this._currentAnim;
            this.endOfLoop = false;
        }

        const currentVATTime = this.entityData.vat.time;
        const currentAnimFrame = Math.floor((currentVATTime - this._currentAnimVATTimeAtStart) * 60);

        // if animation is loop=false; and finished playing
        if (currentAnimFrame >= this.toFrame - this.fromFrame && this._currentAnim.loop === false && this.endOfLoop === false) {
            console.log("ANIMATION FINISHED, STOP ANIMATION ", this.currentFrame, this.targetFrame);
            this.mesh.instancedBuffers.bakedVertexAnimationSettingsInstanced.set(this.toFrame - 1, this.toFrame, this._currentAnimVATOffset, 60);
            this.endOfLoop = true;
            player.meshController.equipments.forEach((itemMesh) => {
                console.log("ITEM ANIMATION FINISHED, STOP ANIMATION ", this.currentFrame, this.targetFrame);
                itemMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced.set(this.toFrame - 1, this.toFrame, this._currentAnimVATOffset, 60);
            });
        }
    }

    refreshItems() {
        this._entity.meshController.equipments.forEach((itemMesh) => {
            //console.log("EQUIPEMENT CHANGE ANIMATION TO", this._currentAnim);
            this.setAnimationParameters(itemMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced, this._currentAnim);
        });
    }
}
