import Config from "../../../shared/Config";
import { randomNumberInRange } from "../../../shared/Utils";
import { State } from "../brain/StateManager";

class IdleState extends State {
    enter(owner) {
        owner.IDLE_TIMER = 0;
        owner.IDLE_TIMER_LENGTH = 1000;
    }

    execute(owner) {
        // if static spawn, stay idle
        if (owner.AI_SPAWN_INFO.type == "static") {
            return false;
        }

        owner.IDLE_TIMER += Config.updateRate;
        if (owner.IDLE_TIMER > owner.IDLE_TIMER_LENGTH) {
            owner._stateMachine.changeTo("PATROL");
            return false;
        }
        //console.log("[IdleState] idle entity", owner.IDLE_TIMER, owner.IDLE_TIMER_LENGTH);
    }

    exit(owner) {}
}

export default IdleState;
