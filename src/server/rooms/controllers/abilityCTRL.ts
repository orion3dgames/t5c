import { Vector3 } from "../../../shared/Libs/yuka-min";
import { randomNumberInRange } from "../../../shared/Utils";
import { Ability, CalculationTypes, EntityState, ServerMsg } from "../../../shared/types";
import Logger from "../../utils/Logger";

export class abilitiesCTRL {
    private _owner;
    public events = [];
    public abilitiesDB;

    public player_casting_timer;
    public ability_in_cooldown: boolean[] = [false, false, false, false, false, false, false, false, false, false, false];
    public gdc_in_cooldown: boolean = false;

    constructor(owner) {
        this._owner = owner;
        this.abilitiesDB = this._owner._state.gameData.load("abilities");
    }

    public addAbility(owner, target, data) {
        let digit = data.digit;
        let ability = this.getByDigit(digit);

        // make sure ability exists
        if (!ability) {
            Logger.warning(`[addAbility] ability does not exist`, digit);
            return false;
        }

        // make sure player can cast this ability
        if (!this.canEntityCastAbility(owner, target, ability, digit)) {
            Logger.warning(`[canEntityCastAbility] ability can be cast`, ability.key);
            return false;
        }

        // rotate towards player
        if (target) {
            owner.rot = owner.rotateTowards(owner.getPosition(), target.getPosition());
        }

        // if there is a minRange, set target as target
        // this is because entity needs to be closer to target before casting ability
        if (ability.minRange > 0 && ability.needTarget && target) {
            let start = this._owner.getPosition();
            let distanceToTarget = start.distanceTo(target.getPosition());
            if (distanceToTarget > ability.minRange) {
                Logger.warning(`[addAbility] ability must be cast close to target`, ability.key);
                ability.digit = digit;
                owner.AI_TARGET = target;
                owner.AI_ABILITY = ability; // store ability to use once user gets close enough
                return false;
            }
        }

        // if ability must be casted
        if (ability.castTime > 0) {
            Logger.warning(`[addAbility] ability has a cast time`, ability.key);

            // inform player he can start casting
            let client = this._owner.getClient();
            client.send(ServerMsg.PLAYER_CASTING_START, {
                digit: data.digit,
            });

            // play animation
            owner.animationCTRL.playAnim(owner, EntityState.SPELL_CASTING, ability.animation, ability.castTime, () => {
                // process ability straight away
                this.cast(this._owner, target, ability, digit);
            });
        } else {
            // process ability straight away
            this.cast(this._owner, target, ability, digit);
        }
    }

    cast(owner, target, ability, digit) {
        Logger.warning(`[cast] casting ability`, ability.key);

        // affect caster
        this.affectCaster(owner, ability);

        // start owner cooldown
        this.startCooldown(digit, ability);

        /////////////////////////////
        // if area of effect ability
        if (ability.range > 0) {
            // find target
            let targets = this.findTargetsInRange(owner, ability.range);
            targets.forEach((t) => {
                // affect target
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
        } else {
            //////////////////////
            // else single target

            // affect target
            this.affectTarget(target, owner, ability);

            // send to clients
            owner._state._gameroom.broadcast(ServerMsg.PLAYER_ABILITY_CAST, {
                key: ability.key,
                digit: digit,
                fromId: owner.sessionId,
                targetId: target.sessionId,
                damage: 0,
            });

            // check if entity is dead
            if (target.isEntityDead()) {
                this.processDeath(owner, target);
            }
        }

        // play animation
        owner.animationCTRL.playAnim(owner, ability.animation, EntityState.IDLE, ability.animationDuration, () => {
            // give a little bbreak between each ability
            this.gdc_in_cooldown = true;
            setTimeout(() => {
                this.gdc_in_cooldown = false;
            }, 500);
        });
    }

    processDeath(owner, target) {
        console.log("entity is dead", "PROCESS DEATH TO BE IMPLEMENTED");

        if (target.isEntityDead() && target.isDead === false) {
            target.setAsDead();
        }
    }

    shouldAffectTarget(owner, target, ability) {
        let start = this._owner.getPosition() as Vector3;
        let distanceToTarget = start.distanceTo(target.getPosition());

        //
        if (ability.minRange > 0 && distanceToTarget > ability.minRange) {
            return false;
        }

        // if target is dead, do nothing
        if (target && target.isEntityDead()) {
            return false;
        }

        // sender cannot cast on himself
        if (ability.castSelf === false && target.sessionId === this._owner.sessionId) {
            Logger.warning(`[canEntityCastAbility] cannot cast this ability on yourself`);
            return false;
        }

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

            // affinity roll

            /*
            // add any multiplicater
            if (p.key === "health" && owner.AI_SPAWN_INFO && owner.AI_SPAWN_INFO.baseDamageMultiplier) {
                base_damage *= owner.AI_SPAWN_INFO.baseDamageMultiplier;
            }

            if (p.key === "health") {
                healthDamage = base_damage;
            }

            // add a multiplier to increase damage per level
            //base_damage *= 1 + owner.level / 10;
            */

            let amount = this.affect(p.type, target[p.key], base_damage);

            target[p.key] = amount;
        });
        return healthDamage;
    }

    canEntityCastAbility(owner, target, ability, digit) {
        // if owner no longer exists
        if (!this._owner) {
            Logger.warning(`[canEntityCastAbility] owner no longer exists`);
        }

        // if caster is dead, cancel everything
        if (this._owner.isEntityDead()) {
            Logger.warning(`[canEntityCastAbility] owner is dead`);
            return false;
        }

        // if ability already running
        if (this._owner.animationCTRL.isAnimating) {
            Logger.warning(`[canEntityCastAbility] player is already casting an ability`);
            return false;
        }

        // if ability already running
        if (this.gdc_in_cooldown) {
            Logger.warning(`[canEntityCastAbility] please wait for gdc COOLDOWN`);
            return false;
        }

        // if in cooldown
        if (this.ability_in_cooldown[digit]) {
            Logger.warning(`[canEntityCastAbility] ability is in cooldown`, digit);
            return false;
        }

        // if ability does not need a target
        if (ability.needTarget === true && !target) {
            Logger.warning(`[canEntityCastAbility] you must have a target before casting this ability`);
            return false;
        }

        // sender cannot cast on himself
        if (ability.needTarget === true && ability.castSelf === false && target.sessionId === this._owner.sessionId) {
            Logger.warning(`[canEntityCastAbility] cannot cast this ability on yourself`);
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

        /*
        // if target is moving
        if (owner.isMoving) {
            Logger.warning(`[canEntityCastAbility] target is moving, cannot cast an ability`, this._owner.isMoving);
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

        */

        // can cast this ability
        Logger.info(`[canEntityCastAbility] player can cast ability`, ability.key);

        return true;
    }

    //
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

                // else players should hit any entity in range if canAttack == true;
            } else if (owner.type === "player" && entity.type === "entity" && entity.AI_SPAWN_INFO.canAttack === true) {
                let distance = entity.getPosition();
                let distanceBetween = distance.squaredDistanceTo(ownerPosition);
                if (distanceBetween < range) {
                    targets.push(entity);
                }

                // else players should hit any other players in range
            } else if (owner.type === "player" && entity.type === "player" && owner.sessionId !== entity.sessionId) {
                let distance = entity.getPosition();
                let distanceBetween = distance.squaredDistanceTo(ownerPosition);
                if (distanceBetween < range) {
                    targets.push(entity);
                }
            }
        });
        return targets;
    }

    // start ability cooldown
    startCooldown(digit, ability) {
        this.ability_in_cooldown[digit] = true;
        setTimeout(() => {
            this.ability_in_cooldown[digit] = false;
        }, ability.cooldown);
    }

    getByDigit(digit): Ability {
        let hotbarData = this._owner.player_data.hotbar.get("" + digit);
        if (hotbarData) {
            return this.abilitiesDB[hotbarData.key] as Ability;
        }
    }
}
