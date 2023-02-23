import Logger from "../../../shared/Logger";

import { AbilitiesDB } from "../../../shared/Data/AbilitiesDB";
import { Ability } from "../../../shared/Entities/Common/Ability";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { Leveling } from "../../../shared/Entities/Player/Leveling";
import { nanoid } from "nanoid";
import { ItemState } from "../schema/ItemState";
import { randomNumberInRange } from "../../../shared/Utils";
import { dropCTRL } from "./dropCTRL";

export class abilitiesCTRL {
    private _owner;
    public abilitiesOwned;
    public abilitiesDB;
    public abilities: Ability[] = [];

    public ability_in_cooldown: boolean[] = [false, false, false, false, false, false, false, false, false, false, false];
    public player_interval;
    public player_cooldown: number = 1000;
    public player_cooldown_timer: number = 0;
    public player_casting_timer: any = false;
    public gracePeriod: boolean = true;
    public attackTimer;

    constructor(owner) {
        this._owner = owner;
        this.abilitiesOwned = this._owner.abilities;
        this.abilitiesDB = AbilitiesDB;
        this.create();
    }

    public create() {
        for (let index in this.abilitiesOwned) {
            const key = this.abilitiesOwned[index];
            const skill = this.abilitiesDB[key];
            this.abilities.push(new Ability(skill));
        }
    }

    public update() {}

    /**
     * process ability
     * @param owner
     * @param target
     * @param data
     * @returns void
     */
    async processAbility(owner, target, data) {
        let digit = data.digit;
        let ability = this.getByDigit(digit);

        // make sure ability exists
        if (!ability) {
            return false;
        }

        // cancel any existing auto attack
        this.cancelAutoAttack(owner);

        // make sure player can cast this ability
        if (!this.canEntityCastAbility(target, ability, digit)) {
            return false;
        }

        // if there is a minRange, set target as target
        if (ability.minRange > 0) {
            owner.AI_CURRENT_TARGET = target;
            owner.AI_CURRENT_ABILITY = ability; // store ability to use once user gets close enough
            return false;
        }

        // if ability can be casted
        if (ability.castTime > 0) {
            // inform player he can start casting
            let client = this._owner.getClient();
            client.send("ability_start_casting", {
                digit: data.digit,
            });

            // start a timer
            this.player_casting_timer = setTimeout(() => {
                // process ability straight away
                this.castAbility(this._owner, target, ability, digit);
            }, ability.castTime);
        } else {
            // process ability straight away
            this.castAbility(this._owner, target, ability, digit);
        }
    }

    startAutoAttack(owner, target, ability) {
        this.doAutoAttack(owner, target, ability);
        this.attackTimer = setInterval(() => {
            this.doAutoAttack(owner, target, ability);
        }, 900);
    }

    doAutoAttack(owner, target, ability) {
        owner.state = EntityCurrentState.ATTACK;
        this.castAbility(owner, target, ability, 1);
    }

    cancelAutoAttack(owner) {
        owner.AI_CURRENT_TARGET = null;
        owner.AI_CURRENT_ABILITY = null;
        owner.state = EntityCurrentState.IDLE;
        clearInterval(this.attackTimer);
    }

    getByDigit(digit) {
        return this.abilities[digit - 1];
    }

    targetIsInRange(target, ability): boolean {
        let start = this._owner.getPosition();
        let end = target.getPosition();
        let distance = start.distanceTo(end);
        if (distance > ability.minRange) {
            Logger.warning(`[canEntityCastAbility] player is out of range ${distance} to ${ability.range} `, ability.range);
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
        if (this._owner.health < 0 || this._owner.health === 0) {
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
        if (manaNeeded > 0 && this._owner.mana < manaNeeded) {
            Logger.warning(`[canEntityCastAbility] not enough mana available`, this._owner.mana);
            return false;
        }

        // sender cannot cast on himself
        if (ability.castSelf === false && target.sessionId === this._owner.sessionId) {
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
            let property = ability.targetPropertyAffected[p] + ability.targetPropertyAffected[p] / (Math.random() * (100 - 0) + 0);
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
    castAbility(owner, target, ability, digit) {
        // rotate sender to face target
        owner.rot = owner.moveCTRL.calculateRotation(owner.getPosition(), target.getPosition());

        // set sender as enemy target
        if (target.type === "entity") {
            target.setTarget(owner);
        }

        this.affectCaster(ability);

        if (ability.repeat > 0) {
            let repeat = 1;
            let timer = setInterval(() => {
                this.affectTarget(target, ability);
                if (target.isEntityDead()) {
                    this.processDeath(owner, target);
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
        owner._gameroom.broadcast("entity_ability_cast", {
            key: ability.key,
            digit: digit,
            fromId: owner.sessionId,
            fromPos: owner.getPosition(),
            targetId: target.sessionId,
            targetPos: target.getPosition(),
        });

        // removing any casting timers
        if (this.player_casting_timer) {
            this.player_casting_timer = false;
        }

        if (target.isEntityDead()) {
            this.processDeath(owner, target);
        }
    }

    processDeath(owner, target) {
        if (target.isDead) {
            return false;
        }

        this.cancelAutoAttack(owner);

        // set target as dead
        target.setAsDead();

        // inform player
        let client = owner.getClient();
        client.send("notification", {
            type: "event",
            message: "You've killed " + target.name + ".",
            date: new Date(),
        });

        // update caster rewards
        if (client) {
            let drop = new dropCTRL(owner, client);
            drop.addExperience(target);
            drop.addGold(target);
            drop.dropItems(target);
        }
    }
}
