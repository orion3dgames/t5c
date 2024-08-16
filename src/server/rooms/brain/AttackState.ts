import { EntityState, AI_STATE } from "../../../shared/types";
import { State } from "../brain/StateManager";
import { BrainSchema } from "../schema";

class AttackState extends State {
    enter(owner) {
        //console.log("[AttackState] ----------------------------------");
        owner.ai_state = AI_STATE.ATTACKING;
        owner.ATTACK_TIMER = 0;
        owner.ATTACK_ISINTERVAL = true;
        //owner.anim_state = EntityState.ATTACK_HORIZONTAL;

        this.attack(owner);
    }

    getAbilityKeyByChance(abilities) {
        var sum = 0;
        let result = "base_attack";
        for (let i = 0; i < abilities.length; i++) {
            sum += abilities[i].chance;
        }
        var rnd = Math.floor(Math.random() * (sum * 100));
        var counter = 0;
        for (let i = 0; i < abilities.length; i++) {
            counter += abilities[i].chance * 100;
            if (counter > rnd) {
                result = abilities[i].key;
                break;
            }
        }
        return result;
    }

    attack(owner) {
        // cast ability
        let abilities = owner.AI_SPAWN_INFO.abilities ?? [];
        let abilityKey = this.getAbilityKeyByChance(abilities);
        let ability = owner._state.gameData.get("ability", abilityKey);
        owner.abilitiesCTRL.cast(owner, owner.AI_TARGET, ability, 1);
        console.log(owner.name, owner.sessionId, "attacking with", abilityKey, "target: ", owner.AI_TARGET.sessionId);
    }

    execute(owner: BrainSchema) {
        // target is valid, keep attacking
        if (owner.AI_TARGET === null || owner.AI_TARGET === undefined || owner.AI_TARGET === false || owner.AI_TARGET.isEntityDead() === true) {
            //console.log("[AttackState] invalid target");
            owner._stateMachine.changeTo("PATROL");
            return false;
        }

        // if target is escaping, go back to searching
        if (owner.AI_TARGET_DISTANCE > owner._state.config.MONSTER_ATTACK_DISTANCE) {
            //console.log("[AttackState] target is escaping, go back to searching");
            owner.AI_TARGET_WAYPOINTS = [];
            owner._stateMachine.changeTo("CHASE");
            return false;
        }

        // rotate towards target
        owner.rot = owner.rotateTowards(owner.getPosition(), owner.AI_TARGET.getPosition());

        // attack target
        if (owner.ATTACK_TIMER >= owner._state.config.COMBAT_SPEED) {
            if (!owner.ATTACK_ISINTERVAL) {
                owner.ATTACK_ISINTERVAL = true;

                // cast ability
                this.attack(owner);
            } else {
                // break time
                owner.ATTACK_ISINTERVAL = false;
            }

            owner.ATTACK_TIMER = 0;
        }

        // increment attack timer
        owner.ATTACK_TIMER += owner._state.config.updateRate;
    }

    exit(owner) {
        owner.resetDestination();
    }
}

export default AttackState;
