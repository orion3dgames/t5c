import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { Entity } from "../Entity";
import { EntityState } from "../../../shared/types";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class EntityAnimator {
    private _entity;
    public mesh;
    private entityData;
    private ratio;

    //animations
    private _animations = [];
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
        this.entityData = entity.entityData;

        this._entity = entity;
        this.ratio = 0;

        this._build();
    }

    public refreshAnimationRatio() {
        /*
        this.ratio = this._entity._scene.getAnimationRatio();
        // set animation speed
        this._idle.speedRatio = this.entityData.animations["IDLE"].speed * this.ratio;
        this._walk.speedRatio = this.entityData.animations["WALK"].speed * this.ratio;
        this._attack.speedRatio = this.entityData.animations["ATTACK"].speed * this.ratio;
        this._death.speedRatio = this.entityData.animations["DEATH"].speed * this.ratio;
        */
    }

    private _build(): void {
        // build animation list and properties
        let animations = this._entity.raceData.vat.animations ?? [];
        let i = 0;
        for (let key in animations) {
            let anim = animations[key];
            anim.key = key;
            anim.index = i;
            (anim.ranges = this.entityData.animationRanges[i]), (this._animations[key] = anim);
            i++;
        }
        //console.log("animations", this._animations);
        // set default animation
        this._currentAnim = this.getAnimation("IDLE");
        this._prevAnim = this.getAnimation("WALK");
    }

    getAnimation(key) {
        return this._animations[key];
    }

    // This method will compute the VAT offset to use so that the animation starts at frame #0 for VAT time = time passed as 3rd parameter
    computeOffsetInAnim(fromFrame, toFrame, time, delta) {
        const totalFrames = toFrame - fromFrame + 1;
        const t = (time * delta) / totalFrames;
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
    private checkIfPlayerIsMoving(currentPos: Vector3, nextPos: Vector3, epsilon = 0.01): boolean {
        return !currentPos.equalsWithEpsilon(nextPos, epsilon);
    }

    // determine what animation should be played
    public animate(entity): void {
        let currentPos = entity.getPosition();
        let nextPos = entity.moveController.getNextPosition();
        entity.isMoving = false;

        // if player has died
        if (entity.anim_state === EntityState.DEAD) {
            this._currentAnim = this.getAnimation("DEATH");

            // if player is attacking
        } else if (entity.anim_state === EntityState.ATTACK_01) {
            this._currentAnim = this.getAnimation("ATTACK_01");

            // if player is attacking
        } else if (entity.anim_state === EntityState.ATTACK_02) {
            this._currentAnim = this.getAnimation("ATTACK_02");

            // if player is attacking
        } else if (entity.anim_state === EntityState.SPELL_CASTING) {
            this._currentAnim = this.getAnimation("SPELL_CASTING");

            // if player is attacking
        } else if (entity.anim_state === EntityState.SPELL_CAST) {
            this._currentAnim = this.getAnimation("SPELL_CAST");

            // if player is moving
        } else if (this.checkIfPlayerIsMoving(currentPos, nextPos) && entity.health > 0) {
            //console.log("PLAYER IS STILL MOVING...");
            this._currentAnim = this.getAnimation("WALK");
            entity.isMoving = true;

            // todo: I hate this, but I have no idea how to fix this in a better way at this stage...
            /*
            if (entity._input && !entity._input.player_can_move) {
                this._currentAnim = this.getAnimation('IDLE');
                entity.isMoving = false;
            }*/

            // else play idle
        } else {
            this._currentAnim = this.getAnimation("IDLE");
        }

        if (entity.type === "player" && entity.anim_state !== EntityState.IDLE) {
            //console.log(entity.anim_state, EntityState[entity.anim_state], this._animations);
        }
    }

    // play animation
    play(player) {
        const fpsAdjusted = 60 * this._currentAnim.speed;

        //
        if (!this.mesh) return false;

        // play animation and stop previous animation
        if (this._currentAnim != null && this._prevAnim !== this._currentAnim) {
            //console.log("[PLAY 1] ANIMATION CHANGED for", player.name, this._prevAnim.name, "-", this._currentAnim.name);
            this.setAnimationParameters(this.mesh.instancedBuffers.bakedVertexAnimationSettingsInstanced, this._currentAnim, fpsAdjusted);
            player.meshController.equipments.forEach((itemMesh) => {
                this.setAnimationParameters(itemMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced, this._currentAnim, fpsAdjusted);
            });
            this._prevAnim = this._currentAnim;
            this.endOfLoop = false;
        }

        //
        const currentVATTime = this.entityData.vat.time;
        const currentAnimFrame = Math.floor((currentVATTime - this._currentAnimVATTimeAtStart) * fpsAdjusted);

        // if animation is loop=false; and finished playing
        if (currentAnimFrame >= this.toFrame - this.fromFrame && this._currentAnim.loop === false && this.endOfLoop === false) {
            //console.log("[PLAY 2] ANIMATION FINISHED, STOP ANIMATION ", this.currentFrame, this.targetFrame);
            this.mesh.instancedBuffers.bakedVertexAnimationSettingsInstanced.set(this.toFrame - 1, this.toFrame, this._currentAnimVATOffset, fpsAdjusted);
            this.endOfLoop = true;
            player.meshController.equipments.forEach((itemMesh) => {
                //console.log("ITEM ANIMATION FINISHED, STOP ANIMATION ", this.currentFrame, this.targetFrame);
                itemMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced.set(this.toFrame - 1, this.toFrame, this._currentAnimVATOffset, fpsAdjusted);
            });
        }
    }

    refreshItems() {
        this._entity.meshController.equipments.forEach((itemMesh) => {
            this.setAnimationParameters(itemMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced, this._currentAnim);
        });
    }

    refreshItem(itemMesh) {
        this.setAnimationParameters(itemMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced, this._currentAnim);
    }

    refreshAnimation() {
        this._prevAnim = false;
    }
}
