import Logger from "../../utils/Logger";
import { EntityState, Ability, CalculationTypes, ServerMsg } from "../../../shared/types";
import { dropCTRL } from "./dropCTRL";
import { AbilitySchema } from "../schema/player/AbilitySchema";
import { randomNumberInRange } from "../../../shared/Utils";
import { HotbarSchema, PlayerSchema } from "../schema";
import { Vector3 } from "../../../shared/Libs/yuka-min";

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
    public attackInterval;

    constructor(owner, data) {
        this._owner = owner;
        this.abilitiesDB = this._owner._state.gameData.load("abilities");
    }

    public update() {}

    /**
     * allow player to learn a ability
     * @param ability
     */
    public learnAbility(key) {
        const ability = this._owner._state.gameData.get("ability", key);

        // only proceed if the ability exists
        if (!ability) {
            return false;
        }

        // only proceed if the ability does not already
        if (!this._owner.player_data.abilities[ability.key]) {
            // add ability to player
            this._owner.player_data.abilities.set(
                ability.key,
                new AbilitySchema({
                    key: ability.key,
                })
            );
            // add ability to the hotbar
            let slotAvailable = this._owner.findNextAvailableHotbarSlot();
            if (slotAvailable) {
                this._owner.player_data.hotbar.set(
                    slotAvailable,
                    new HotbarSchema({
                        digit: slotAvailable,
                        type: "ability",
                        key: ability.key,
                    })
                );
            }
        }
    }

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

        // make sure player can cast this ability
        if (!this.canEntityCastAbility(owner, target, ability, digit)) {
            return false;
        }

        // cancel any existing auto attack
        this.cancelAutoAttack(owner);

        // if there is a minRange, set target as target
        if (ability.minRange > 0 && owner.AI_TARGET != target) {
            console.log("minRange > 0");
            ability.digit = digit;
            owner.AI_TARGET = target;
            owner.AI_ABILITY = ability; // store ability to use once user gets close enough
            return false;
        }

        // if ability can be casted
        if (ability.castTime > 0) {
            // inform player he can start casting
            let client = this._owner.getClient();
            client.send(ServerMsg.PLAYER_CASTING_START, {
                digit: data.digit,
            });

            // play animation
            owner.animationCTRL.playAnim(owner, EntityState.SPELL_CASTING, true);
            owner.rot = owner.rotateTowards(owner.getPosition(), target.getPosition());

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

    getByDigit(digit) {
        let hotbarData = this._owner.player_data.hotbar.get("" + digit);
        if (hotbarData) {
            return this.abilitiesDB[hotbarData.key];
        }
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
    canEntityCastAbility(owner, target, ability, digit) {
        // if target is moving
        if (owner.isMoving) {
            Logger.warning(`[canEntityCastAbility] target is moving, cannot cast an ability`, this._owner.isMoving);
            return false;
        }

        // if abiltiy already running
        if (this._owner.animationCTRL.currentTimeout) {
            Logger.warning(`[canEntityCastAbility] player is already casting an ability`);
            return false;
        }

        // if already casting
        if (ability.castTime > 0 && this.player_casting_timer !== false) {
            Logger.warning(`[canEntityCastAbility] player is already casting an ability`);
            return false;
        }

        // if caster is dead, cancel everything
        if (this._owner.health < 0 || this._owner.health === 0) {
            Logger.warning(`[canEntityCastAbility] caster is dead`);
            return false;
        }

        // if ability not found, cancel everything
        if (!ability) {
            Logger.error(`[canEntityCastAbility] ability not found`, ability.key);
            return false;
        }

        // if in cooldown
        if (this.ability_in_cooldown[digit]) {
            Logger.warning(`[canEntityCastAbility] ability is in cooldown`, digit);
            return false;
        }

        // only cast ability if enought mana is available
        let prop = ability.casterPropertyAffected.find((prop) => prop.key === "mana");
        if (prop && prop.min > 0 && this._owner.mana < prop.min) {
            Logger.warning(`[canEntityCastAbility] not enough mana available`, this._owner.mana);
            return false;
        }

        // if ability does not need a target
        if (ability.needTarget === true && !target) {
            Logger.warning(`[canEntityCastAbility] you must have a target before casting this ability`);
            return false;
        }

        // if target is not already dead
        if (target && target.isEntityDead()) {
            Logger.warning(`[canEntityCastAbility] target is dead`, target.health);
            return false;
        }

        // if target is not attackable
        if (target && target.AI_SPAWN_INFO && target.AI_SPAWN_INFO.canAttack === false) {
            Logger.warning(`[canEntityCastAbility] target is not attackable`, target.health);
            return false;
        }

        // sender cannot cast on himself
        if (ability.needTarget === true && ability.castSelf === false && target.sessionId === this._owner.sessionId) {
            Logger.warning(`[canEntityCastAbility] cannot cast this ability on yourself`);
            return false;
        }

        Logger.info(`[canEntityCastAbility] player can cast ability`, ability.key);

        return true;
    }

    affect(type, start, amount) {
        switch (type) {
            case CalculationTypes.ADD:
                start += amount;
                break;
            case CalculationTypes.REMOVE:
                start -= amount;
                break;
            case CalculationTypes.MULTIPLY:
                start *= amount;
                break;
        }
        return start;
    }

    // process caster affected properties
    affectCaster(owner, ability) {
        ability.casterPropertyAffected.forEach((p) => {
            let result = randomNumberInRange(p.min, p.max);
            let amount = this.affect(p.type, owner[p.key], result);
            owner[p.key] = amount;
        });
    }

    // process target affected properties
    affectTarget(target, owner, ability) {
        let healthDamage = 0;
        ability.targetPropertyAffected.forEach((p) => {
            // get min and max damage
            let base_min = p.min;
            let base_max = p.max;

            // generate a random number
            let base_damage = randomNumberInRange(base_min, base_max);

            // add any multiplicater
            if (p.key === "health" && owner.AI_SPAWN_INFO && owner.AI_SPAWN_INFO.baseDamageMultiplier) {
                base_damage *= owner.AI_SPAWN_INFO.baseDamageMultiplier;
            }

            // add a multiplier to increase damage per level
            base_damage *= 1 + owner.level / 10;

            let amount = this.affect(p.type, target[p.key], base_damage);

            target[p.key] = amount;
        });
        return healthDamage;
    }

    // start cooldown
    startCooldown(digit, ability) {
        // start cooldown period
        this.ability_in_cooldown[digit] = true;
        setTimeout(() => {
            this.ability_in_cooldown[digit] = false;
        }, ability.cooldown);
    }

    findTargetsInRange(owner, range) {
        let targets = [];
        let ownerPosition = owner.getPosition() as Vector3;
        owner._state.entities.forEach((entity) => {
            // if AI, only targets players
            if (owner.type === "entity" && entity.type === "player") {
                let distance = entity.getPosition();
                let distanceBetween = distance.squaredDistanceTo(ownerPosition);
                if (distanceBetween < range) {
                    targets.push(entity);
                }

                // else players should hit any entity in range
            } else if (owner.type === "player" && owner.sessionId !== entity.sessionId) {
                /*
                let entityPosition = entity.getPosition();
                let p1 = ownerPosition.sub(entityPosition).normalize();
                let p2 = entityPosition.normalize();
                console.log(entity.name + " is in field of view: ", this.isInFov(p2, p1));
                */
                let distance = entity.getPosition();
                let distanceBetween = distance.squaredDistanceTo(ownerPosition);
                if (distanceBetween < range) {
                    targets.push(entity);
                }
            }
        });
        return targets;
    }

    isInFov(fovDirection: Vector3, directionToTarget: Vector3, fovAngle = Math.PI / 2) {
        let dot = fovDirection.dot(directionToTarget);
        let angleToTarget = Math.acos(dot);
        return angleToTarget <= fovAngle / 2;
    }

    /**
     * cast an ability onto target
     * does not do any check, use canEntityCastAbility() to check.
     * @param target
     * @param ability
     * @param digit
     */
    castAbility(owner, target, ability: Ability, digit) {
        //console.log("castAbility", digit, ability);

        // rotate sender to face target
        if (target && target.sessionId !== owner.sessionId && owner.moveCTRL) {
            console.log("rotate sender to face target", digit);
            owner.rot = owner.moveCTRL.calculateRotation(owner.getPosition(), target.getPosition());
        }

        // set sender as enemy target
        if (target.type === "entity") {
            target.setTarget(owner);
        }

        // affect caster
        this.affectCaster(owner, ability);

        // if area of effect ability
        if (ability.range > 0) {
            // find target
            let targets = this.findTargetsInRange(owner, ability.range);
            targets.forEach((t) => {
                this.affectTarget(t, owner, ability);

                // send to clients
                owner._state._gameroom.broadcast(ServerMsg.PLAYER_ABILITY_CAST, {
                    key: ability.key,
                    digit: digit,
                    fromId: owner.sessionId,
                    targetId: t.sessionId,
                    damage: 0,
                });

                // check if entity is dead
                if (t.isEntityDead()) {
                    this.processDeath(owner, t);
                }
            });

            // else single target
        } else {
            let healthDamage = 0;
            if (ability.repeat > 0) {
                let repeat = 1;
                let timer = setInterval(() => {
                    healthDamage = this.affectTarget(target, owner, ability);
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
                healthDamage = this.affectTarget(target, owner, ability);
            }

            // send to clients
            owner._state._gameroom.broadcast(ServerMsg.PLAYER_ABILITY_CAST, {
                key: ability.key,
                digit: digit,
                fromId: owner.sessionId,
                targetId: target.sessionId,
                damage: healthDamage,
            });

            if (target.isEntityDead()) {
                this.processDeath(owner, target);
            }
        }

        // start owner cooldown
        this.startCooldown(digit, ability);

        // removing any casting timers
        if (this.player_casting_timer) {
            clearTimeout(this.player_casting_timer);
            this.player_casting_timer = false;
        }

        // play animation
        owner.animationCTRL.playAnim(owner, ability.animation, () => {});
    }

    processDeath(owner, target) {
        if (target.isDead) {
            return false;
        }

        if (owner.isDead) {
            return false;
        }

        console.log("PROCESS DEATH 4");

        // check if quest update
        owner.dynamicCTRL.checkQuestUpdate("kill", target);

        // cancel auto attack timer
        this.cancelAutoAttack(owner);

        // get player
        let client = owner.getClient();

        // send notif to player
        client.send(ServerMsg.SERVER_MESSAGE, {
            type: "event",
            message: "You've killed " + target.name + ".",
            date: new Date(),
        });

        // process drops, experience and gold
        let drop = new dropCTRL(owner, client);
        drop.addExperience(target);
        drop.addGold(target);
        drop.dropItems(target);
    }

    //////////////////////////////////////////////
    ////////////// BASIC AUTO ATTACK /////////////
    //////////////////////////////////////////////

    startAutoAttack(owner, target, ability) {
        if (!owner || !target || !ability) {
            return false;
        }

        if (this.attackTimer) {
            clearInterval(this.attackTimer);
        }

        if (ability.autoattack) {
            console.log("----------startAutoAttack--------");

            this.doAutoAttack(owner, target, ability);
            this.attackInterval = 0;
            this.attackTimer = setInterval(() => {
                this.attackInterval++;
                if (this.attackInterval === 2) {
                    this.attackInterval = 0;
                    this.doAutoAttack(owner, target, ability);
                }
            }, this._owner._state.config.COMBAT_SPEED);
        } else {
            this.castAbility(owner, target, ability, ability.digit);
        }
    }

    doAutoAttack(owner, target, ability) {
        // only auto attack if entity has a target
        if (target !== null) {
            //owner.anim_state = ability.animation;
            this.castAbility(owner, target, ability, ability.digit);
        } else {
            // cancel any existing auto attack
            this.cancelAutoAttack(owner);
        }
    }

    cancelAutoAttack(owner) {
        console.log("----------cancelAutoAttack--------");
        owner.anim_state = EntityState.IDLE;

        this.attackInterval = 0;

        if (owner.AI_TARGET) {
            owner.AI_TARGET = null;
            owner.AI_ABILITY = null;
        }

        if (this.attackTimer) {
            // remove attack timer
            clearInterval(this.attackTimer);
            this.attackTimer = null;
            console.log("------------ CLEAR ATTACK INTERVAL ----------");
        }

        if (this.player_casting_timer) {
            // remove casting timer
            clearInterval(this.player_casting_timer);
            this.player_casting_timer = false;
            owner._state._gameroom.broadcast(ServerMsg.PLAYER_CASTING_CANCEL);
        }
    }

    //////////////////////////////////////////////
    //////////////////////////////////////////////
    //////////////////////////////////////////////
}
