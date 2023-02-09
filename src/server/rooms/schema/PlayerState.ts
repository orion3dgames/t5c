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

export class PlayerState extends EntityState {
    // networked player specific
    @type("number") public experience: number = 0;
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

    constructor(gameroom: GameRoom, data, ...args: any[]) {
        super(gameroom, data, args);

        this.raceData = Races.get(this.race);
        this.ability_in_cooldown = [false, false, false, false, false, false, false, false, false, false, false];

        // add a 5 second grace period where the player can not be targeted by the ennemies
        setTimeout(() => {
            this.gracePeriod = false;
        }, 5000);
    }

    // runs on every server iteration
    update() {
        //
        this.isMoving = false;

        // always check if entity is dead ??
        if (this.isEntityDead()) {
            this.setAsDead();
        }

        // if not dead
        if (this.isDead === false) {
            // level boost
            if (this.level > 1) {
                //this.raceData.maxMana = this.raceData.maxMana * this.level;
                //this.raceData.maxHealth = this.raceData.maxMana * this.level;
            }

            // continuously gain mana
            if (this.mana < this.raceData.maxMana) {
                this.mana += this.raceData.manaRegen;
            }

            // continuously gain health
            if (this.health < this.raceData.maxHealth) {
                this.health += this.raceData.healthRegen;
            }
        }
    }

    /**
     * process a player ability
     * @param client
     * @param target
     * @param data
     * @returns void
     */
    processAbility(client, target, data) {
        let digit = data.digit;
        let ability = Abilities.getByDigit(this, digit);

        // make sure ability exists
        if (!ability) {
            return false;
        }

        let ability_key = ability.key;

        // make sure player can cast this ability
        if (!this.canEntityCastAbility(target, ability, digit)) {
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

        Logger.info(`[canEntityCastAbility] player can cast ability`, ability.key);

        return true;
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

        // start cooldown period
        this.ability_in_cooldown[digit] = true;
        setTimeout(() => {
            this.ability_in_cooldown[digit] = false;
        }, ability.cooldown);

        // process caster affected properties
        // TODO: improve this
        for (let p in ability.casterPropertyAffected) {
            let property = ability.casterPropertyAffected[p];
            this[p] -= property;
        }

        // process target affected properties
        // TODO: improve this
        for (let p in ability.targetPropertyAffected) {
            let property = ability.targetPropertyAffected[p];
            target[p] += property;
        }

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

        // if target has no more health
        if (target.isEntityDead()) {
            // set target as dead
            target.setAsDead();

            // player gains experience
            this.addExperience(target.raceData.experienceGain);
        }
    }

    addExperience(amount) {
        // add experience to player
        this.experience += amount;
        this.level = Leveling.convertXpToLevel(this.experience);
        Logger.info(`[gameroom][addExperience] player has gained ${amount} experience`);

        // does player level up?
        if (Leveling.doesPlayerlevelUp(this.level, this.experience, amount)) {
            Logger.info(`[gameroom][addExperience] player has gained a level and is now level ${this.level}`);
        }
    }

    getPosition() {
        return new Vector3(this.x, this.y, this.z);
    }

    setAsDead() {
        this.isDead = true;
        this.health = 0;
        this.blocked = true;
        this.state = EntityCurrentState.DEAD;

        // revive player after 10 seconds
        setTimeout(() => {
            this.isDead = false;
            this.health = 100;
            this.blocked = false;
            this.state = EntityCurrentState.IDLE;
        }, 10000);
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
        if (this.blocked) {
            this.state = EntityCurrentState.IDLE;
            Logger.warning("Player " + this.name + " is blocked, no movement will be processed");
            return false;
        }

        let speed = this.raceData.speed;

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
            //this.state = EntityCurrentState.WALKING;

            this.isMoving = true;

            //Logger.info('Valid position for '+this.name+': ( x: '+this.x+', y: '+this.y+', z: '+this.z+', rot: '+this.rot);
        } else {
            // collision detected, return player old position
            this.x = oldX;
            this.y = 0;
            this.z = oldZ;
            this.rot = oldRot;
            this.sequence = playerInput.seq;
            //this.state = EntityCurrentState.IDLE;

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
