import { AI_STATE } from "../../../shared/types";
import { State } from "../brain/StateManager";

class ChaseState extends State {
    enter(owner) {
        //console.log("[ChaseState] ----------------------------------");

        // set chase timer
        owner.CHASE_TIMER = 0;

        //
        owner.AI_TARGET_WAYPOINTS = [];

        owner.ai_state = AI_STATE.SEEKING;
    }

    execute(owner) {
        // if target is dead or invalid
        if (owner.AI_TARGET === null || owner.AI_TARGET === undefined || owner.AI_TARGET === false) {
            //console.log("[ChaseState] invalid target");
            owner._stateMachine.changeTo("PATROL");
            return false;
        }

        // iterate searching timer
        owner.CHASE_TIMER += owner._state.config.updateRate;

        // if entity is close enough to player, start attacking it
        if (owner.AI_TARGET_DISTANCE < owner._state.config.MONSTER_ATTACK_DISTANCE) {
            owner._stateMachine.changeTo("ATTACK");
            //console.log("[ChaseState] target found and is close enough");
            return false;
        }

        // if entity has been chasing for longer than Config.MONSTER_SEARCHING_PERIOD
        if (owner.CHASE_TIMER > owner._state.config.MONSTER_CHASE_PERIOD) {
            //console.log("[ChaseState] target lost");
            owner._stateMachine.changeTo("PATROL");
            return false;
        }

        // if player come back into range, reset chase timer
        if (owner.AI_TARGET_DISTANCE < owner._state.config.MONSTER_AGGRO_DISTANCE) {
            owner.CHASE_TIMER = 0;
            //console.log("[ChaseState] target back in range");
        }

        // if target has moved, keep searching for target
        if (owner.AI_TARGET_WAYPOINTS.length < 1 && owner.AI_TARGET !== null) {
            // set target position
            owner.AI_TARGET_WAYPOINTS[0] = owner.AI_TARGET.getPosition();
            //console.log("[ChaseState] target not a previous location, search again");
        }

        // else keep moving towards target
        owner.moveTowards();

        // debug
        //console.log("[ChaseState] chasing entity", owner.CHASE_TIMER);
    }

    exit(owner) {}
}

export default ChaseState;
