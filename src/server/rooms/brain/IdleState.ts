import { randomNumberInRange } from "../../../shared/Utils";
import { State } from "../brain/StateManager";
import { AI_STATE } from "../../../shared/types";

class IdleState extends State {
    private _rotationTimer: number = 0;
    private _rotationTimerTimeout: number = 0;

    enter(owner) {
        owner.IDLE_TIMER = 0;
        owner.IDLE_TIMER_LENGTH = randomNumberInRange(1000, 4000);
        owner.ai_state = AI_STATE.IDLE;
    }

    execute(owner) {
        // if static spawn, stay idle
        if (owner.AI_SPAWN_INFO.type == "static") {
            return false;
        }

        // if there is a closest player, and in aggro range
        if (owner.isAnyPlayerInAggroRange() && owner.AI_SPAWN_INFO.aggressive === true) {
            owner.setPlayerTarget(owner.AI_CLOSEST_PLAYER);
            owner._stateMachine.changeTo("CHASE");
        }

        // if entity has a target, start searching for it
        if (owner.hasValidTarget() && owner.AI_SPAWN_INFO.aggressive === true) {
            owner._stateMachine.changeTo("CHASE");
            return false;
        }

        // keep track of idling time
        owner.IDLE_TIMER += owner._state.config.updateRate;
        if (owner.IDLE_TIMER > owner.IDLE_TIMER_LENGTH) {
            owner._stateMachine.changeTo("PATROL");
            return false;
        }
        //console.log("[IdleState] idle entity", owner.IDLE_TIMER, owner.IDLE_TIMER_LENGTH);
    }

    exit(owner) {}
}

export default IdleState;
