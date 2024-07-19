import { EntityState, AI_STATE } from "../../../shared/types";
import { State } from "../brain/StateManager";

class AttackState extends State {
    enter(owner) {
        //console.log("[AttackState] ----------------------------------");
        owner.ai_state = AI_STATE.ATTACKING;
        owner.ATTACK_TIMER = 0;
        owner.ATTACK_ISINTERVAL = false;
        owner.anim_state = EntityState.ATTACK_HORIZONTAL;
    }

    execute(owner) {
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

        // attack target
        if (owner.ATTACK_TIMER >= 900) {
            if (!owner.ATTACK_ISINTERVAL) {
                owner.anim_state = EntityState.IDLE;
                owner.ATTACK_ISINTERVAL = true;

                let damage = owner.calculateDamage(owner, owner.AI_TARGET);
                owner.ATTACK_ISINTERVAL = true;
                owner.AI_TARGET.health -= damage;
                owner.AI_TARGET.normalizeStats();
                console.log(owner.name, owner.sessionId, "attacking", owner.AI_TARGET.sessionId, "dmg: ", damage);
            } else {
                owner.anim_state = EntityState.ATTACK_HORIZONTAL;
                owner.ATTACK_ISINTERVAL = false;
            }

            owner.ATTACK_TIMER = 0;
        }

        // increment attack timer
        owner.ATTACK_TIMER += owner._state.config.updateRate;
        //console.log("[AttackState] attacking entity", owner.AI_TARGET.name);
    }

    exit(owner) {
        owner.resetDestination();
    }
}

export default AttackState;
