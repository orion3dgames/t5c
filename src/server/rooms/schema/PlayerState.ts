import { type } from "@colyseus/schema";
import Logger from "../../../shared/Logger";
import Config from "../../../shared/Config";
import { PlayerInputs } from "../../../shared/types";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { EntityState } from "../schema/EntityState";
import { Vector3 } from "../../../shared/yuka";
import { GameRoom } from "../GameRoom";
import { Abilities } from "../../../shared/Entities/Common/Abilities";
import { Leveling } from "../../../shared/Entities/Player/Leveling";
import { Races } from "../../../shared/Entities/Common/Races";
import { randomNumberInRange } from "src/shared/Utils";

export class PlayerState extends EntityState {
    // networked player specific
    @type("number") public strength: number = 0;
    @type("number") public endurance: number = 0;
    @type("number") public agility: number = 0;
    @type("number") public intelligence: number = 0;
    @type("number") public wisdom: number = 0;

    //
    public player_interval;
    public player_cooldown: number = 1000;
    public ability_in_cooldown: boolean[];
    public player_cooldown_timer: number = 0;
    public player_casting_timer: any = false;
    public gracePeriod: boolean = true;

    public attackTimer;

    constructor(gameroom: GameRoom, data, ...args: any[]) {
        super(gameroom, data, args);

        this.ability_in_cooldown = [false, false, false, false, false, false, false, false, false, false, false];

        // add a 5 second grace period where the player can not be targeted by the ennemies
        setTimeout(() => {
            this.gracePeriod = false;
        }, Config.PLAYER_GRACE_PERIOD);
    }

    // runs on every server iteration
    update() {
        this.isMoving = false;

        // always check if player is dead ??
        if (this.isEntityDead()) {
            this.cancelAutoAttack();
            this.setAsDead();
        } else if (this.isDead) {
            this.setAsDead();
        }

        // if not dead
        if (this.isDead === false) {
            // continuously gain mana
            if (this.mana < this.maxMana) {
                this.mana += this.manaRegen;
            }

            // continuously gain health
            if (this.health < this.maxHealth) {
                this.health += this.healthRegen;
            }
        }

        // if player has a target, monitor it's position.
        this.monitorTarget();

        // if player has a target, start heading towards it.
        // once you get to it start auto attacking
        // autoattack stop if casting, moving, dying
        if (this.hasTarget()) {
            let start = this.getPosition();
            let destination = this.AI_CURRENT_TARGET_POSITION;
            let distance = this.AI_CURRENT_TARGET_DISTANCE;
            if (distance < 4) {
                let ability = this.AI_CURRENT_ABILITY;
                let target = this.AI_CURRENT_TARGET;
                this.doAutoAttack(target, ability);
                this.attackTimer = setInterval(() => {
                    this.doAutoAttack(target, ability);
                }, 900);
                this.AI_CURRENT_TARGET = null;
                this.AI_CURRENT_ABILITY = null;
            } else {
                this.rot = this.calculateRotation(start, destination);
                this.setPosition(this.moveTo(start, destination, this.speed));
            }
        }
    }

    doAutoAttack(target, ability) {
        this.state = EntityCurrentState.ATTACK;
        this.castAbility(target, ability, 1);
    }

    cancelAutoAttack() {
        this.AI_CURRENT_TARGET = null;
        this.AI_CURRENT_ABILITY = null;
        this.state = EntityCurrentState.IDLE;
        clearInterval(this.attackTimer);
    }

    /**
     * process a player ability
     * @param client
     * @param target
     * @param data
     * @returns void
     */
    async processAbility(client, target, data) {
        let digit = data.digit;
        let ability = Abilities.getByDigit(this, digit);

        // make sure ability exists
        if (!ability) {
            return false;
        }

        this.cancelAutoAttack();

        let ability_key = ability.key;

        // make sure player can cast this ability
        if (!this.canEntityCastAbility(target, ability, digit)) {
            return false;
        }

        // if there is a minRange, set target as target
        if (ability.minRange > 0) {
            this.AI_CURRENT_TARGET = target;
            this.AI_CURRENT_ABILITY = ability; // store ability to use once user gets close enough
            return false;
        }

        // if ability can be casted
        if (ability.castTime > 0) {
            // inform player he can start casting
            client.send("ability_start_casting", {
                digit: data.digit,
            });

            // start a timer
            this.player_casting_timer = setTimeout(() => {
                // process ability straight away
                this.castAbility(target, ability, digit);
            }, ability.castTime);
        } else {
            // process ability straight away
            this.castAbility(target, ability, digit);
        }
    }

    targetIsInRange(target, ability): boolean {
        let start = this.getPosition();
        let end = target.getPosition();
        let distance = start.distanceTo(end);
        if (distance > ability.minRange) {
            Logger.warning(
                `[canEntityCastAbility] player is out of range ${distance} to ${ability.range} `,
                ability.range
            );
            return false;
        }
        return true;
    }

    /**
     * Check if player can cast an ability
     * @param target
     * @param ability_no
     * @returns boolean
     */
    canEntityCastAbility(target, ability, digit) {
        // if already casting
        if (ability.castTime > 0 && this.player_casting_timer !== false) {
            Logger.warning(`[canEntityCastAbility] player is already casting an ability`, ability);
            return false;
        }

        // if caster is dead, cancel everything
        if (this.health < 0 || this.health === 0) {
            Logger.warning(`[canEntityCastAbility] caster is dead`, ability);
            return false;
        }

        // if ability not found, cancel everything
        if (!ability) {
            Logger.error(`[canEntityCastAbility] ability not found`, ability);
            return false;
        }

        // if target is not already dead
        if (target.isEntityDead()) {
            Logger.warning(`[canEntityCastAbility] target is dead`, target.health);
            return false;
        }

        // if in cooldown
        if (this.ability_in_cooldown[digit]) {
            Logger.warning(`[canEntityCastAbility] ability is in cooldown`, digit);
            return false;
        }

        // only cast ability if enought mana is available
        let manaNeeded = ability.casterPropertyAffected["mana"] ? ability.casterPropertyAffected["mana"] : 0;
        if (manaNeeded > 0 && this.mana < manaNeeded) {
            Logger.warning(`[canEntityCastAbility] not enough mana available`, this.mana);
            return false;
        }

        // sender cannot cast on himself
        if (ability.castSelf === false && target.sessionId === this.sessionId) {
            Logger.warning(`[canEntityCastAbility] cannot cast this ability on yourself`);
            return false;
        }

        //Logger.info(`[canEntityCastAbility] player can cast ability`, ability.key);

        return true;
    }

    // process caster affected properties
    affectCaster(ability) {
        for (let p in ability.casterPropertyAffected) {
            let property = ability.casterPropertyAffected[p];
            this[p] -= property;
        }
    }

    // process target affected properties
    affectTarget(target, ability) {
        for (let p in ability.targetPropertyAffected) {
            let property =
                ability.targetPropertyAffected[p] +
                (ability.targetPropertyAffected[p] * this.level) / (Math.random() * (100 - 0) + 0);
            target[p] += property;
        }
    }

    // start cooldown
    startCooldown(digit, ability) {
        // start cooldown period
        this.ability_in_cooldown[digit] = true;
        setTimeout(() => {
            this.ability_in_cooldown[digit] = false;
        }, ability.cooldown);
    }

    /**
     * cast an ability onto target
     * does not do any check, use canEntityCastAbility() to check.
     * @param target
     * @param ability
     * @param digit
     */
    castAbility(target, ability, digit) {
        // rotate sender to face target
        this.rot = this.calculateRotation(this.getPosition(), target.getPosition());

        // set sender as enemy target
        if (target.type === "entity") {
            target.setTarget(this);
        }

        this.affectCaster(ability);

        if (ability.repeat > 0) {
            let repeat = 1;
            let timer = setInterval(() => {
                this.affectTarget(target, ability);
                if (target.isEntityDead()) {
                    this.processDeath(target);
                    clearInterval(timer);
                }
                if (repeat >= ability.repeat) {
                    clearInterval(timer);
                }
                repeat += 1;
            }, ability.repeatInterval);
        } else {
            this.affectTarget(target, ability);
        }

        this.startCooldown(digit, ability);

        // make sure no values are out of range.
        target.normalizeStats();

        // send to clients
        this._gameroom.broadcast("entity_ability_cast", {
            key: ability.key,
            digit: digit,
            fromId: this.sessionId,
            fromPos: this.getPosition(),
            targetId: target.sessionId,
            targetPos: target.getPosition(),
        });

        // removing any casting timers
        if (this.player_casting_timer) {
            this.player_casting_timer = false;
        }

        if (target.isEntityDead()) {
            this.processDeath(target);
        }
    }

    processDeath(target) {
        if (target.isDead) {
            return false;
        }

        this.cancelAutoAttack();

        // set target as dead
        target.setAsDead();

        // update caster
        let caster = this._gameroom.clients.get(this.sessionId);
        if (caster) {
            // player gains experience
            let exp = target.experienceGain;
            this.addExperience(exp, caster);

            // inform player
            caster.send("event", {
                type: "experience_gain",
                message: "You've killed " + target.name + " and gained " + exp + " experience.",
            });
        }
    }

    addExperience(amount, caster) {
        // does player level up?
        let doesLevelUp = false;
        if (Leveling.doesPlayerlevelUp(this.level, this.experience, amount)) {
            doesLevelUp = true;
        }

        // add experience to player
        this.experience += amount;
        this.level = Leveling.convertXpToLevel(this.experience);
        Logger.info(`[gameroom][addExperience] player has gained ${amount} experience`);

        if (doesLevelUp) {
            Logger.info(`[gameroom][addExperience] player has gained a level and is now level ${this.level}`);
            this.maxMana = this.maxMana + 50;
            this.maxHealth = this.maxHealth + 50;
            this.health = this.maxHealth;
            this.mana = this.maxMana;
            caster.send("event", {
                type: "level_up",
                message: "You've gained knowledge and are now level " + this.level + ".",
            });
        }
    }

    setAsDead() {
        this.isDead = true;
        this.health = 0;
        this.blocked = true;
        this.state = EntityCurrentState.DEAD;
    }

    resetPosition() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.ressurect();
    }

    ressurect() {
        this.isDead = false;
        this.health = 100;
        this.blocked = false;
        this.state = EntityCurrentState.IDLE;
        this.gracePeriod = true;
        setTimeout(() => {
            this.gracePeriod = false;
        }, Config.PLAYER_GRACE_PERIOD);
    }

    /**
     * is entity dead (isDead is there to prevent setting a player as dead multiple time)
     * @returns true if health smaller than 0 and not already set as dead.
     */
    isEntityDead() {
        return this.health <= 0 && this.isDead === false;
    }

    setLocation(location: string): void {
        this.location = location;
    }

    setPosition(updatedPos: Vector3): void {
        this.x = updatedPos.x;
        this.y = updatedPos.y;
        this.z = updatedPos.z;
    }

    /**
     * Check if player can move from sourcePos to newPos
     * @param {Vector3} sourcePos source position
     * @param {Vector3} newPos destination position
     * @returns boolean
     */
    canMoveTo(sourcePos: Vector3, newPos: Vector3): boolean {
        return this._navMesh.checkPath(sourcePos, newPos);
    }

    /**
     * Calculate next forward position on the navmesh based on playerInput forces
     * @param {PlayerInputs} playerInput
     * @returns
     */
    processPlayerInput(playerInput: PlayerInputs) {
        if (this.blocked && !this.isDead) {
            this.state = EntityCurrentState.IDLE;
            Logger.warning("Player " + this.name + " is blocked, no movement will be processed");
            return false;
        }

        this.cancelAutoAttack();

        let speed = this.speed;

        // save current position
        let oldX = this.x;
        let oldY = this.y;
        let oldZ = this.z;
        let oldRot = this.rot;

        // calculate new position
        let newX = this.x - playerInput.h * speed;
        let newY = this.y;
        let newZ = this.z - playerInput.v * speed;
        let newRot = Math.atan2(playerInput.h, playerInput.v);

        // check if destination is in navmesh
        let sourcePos = new Vector3(oldX, oldY, oldZ); // new pos
        let destinationPos = new Vector3(newX, newY, newZ); // new pos
        const foundPath: any = this._navMesh.checkPath(sourcePos, destinationPos);
        if (foundPath) {
            /*
            // adjust height of the entity according to the ground
            let currentRegion = this._navMesh.getClosestRegion( destinationPos );
            const distance = currentRegion.plane.distanceToPoint( sourcePos );
            let newY = distance * 0.2; // smooth transition
            */

            // next position validated, update player
            this.x = newX;
            this.y = newY;
            this.z = newZ;
            this.rot = newRot;
            this.sequence = playerInput.seq;
            this.isMoving = true;
            this.state = EntityCurrentState.WALKING;

            //Logger.info('Valid position for '+this.name+': ( x: '+this.x+', y: '+this.y+', z: '+this.z+', rot: '+this.rot);
        } else {
            // collision detected, return player old position
            this.x = oldX;
            this.y = 0;
            this.z = oldZ;
            this.rot = oldRot;
            this.sequence = playerInput.seq;
            this.state = EntityCurrentState.IDLE;

            //Logger.warning('Invalid position for '+this.name+': ( x: '+this.x+', y: '+this.y+', z: '+this.z+', rot: '+this.rot);
        }
    }

    /**
     * Calculate rotation based on moving from v1 to v2
     * @param {Vector3} v1
     * @param {Vector3} v2
     * @returns rotation in radians
     */
    calculateRotation(v1: Vector3, v2: Vector3): number {
        return Math.atan2(v1.x - v2.x, v1.z - v2.z);
    }
}
