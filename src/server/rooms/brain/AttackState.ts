import { EntityState, AI_STATE } from "../../../shared/types";
import { State } from "../brain/StateManager";

class AttackState extends State {
    enter(owner) {
        //console.log("[AttackState] ----------------------------------");
        owner.ATTACK_TIMER = 0;

        owner.ai_state = AI_STATE.ATTACKING;
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
            let damage = owner.calculateDamage(owner, owner.AI_TARGET);
            owner.ATTACK_TIMER = 0;
            owner.AI_TARGET.health -= damage;
            owner.AI_TARGET.normalizeStats();
            console.log(owner.name, owner.sessionId, 'attacking', owner.AI_TARGET.sessionId, 'dmg: ', damage);
        }

        // increment attack timer
        owner.ATTACK_TIMER += owner._state.config.updateRate;

        // set state and anim state
        owner.anim_state = EntityState.ATTACK;

        //debug
        //console.log("[AttackState] attacking entity", owner.AI_TARGET.name);
    }

    exit(owner) {
        owner.resetDestination();
    }
}

export default AttackState;
