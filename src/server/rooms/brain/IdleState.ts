import Config from "../../../shared/Config";
import { State } from "../../../shared/yuka";
import { randomNumberInRange } from "../../../shared/Utils";

class IdleState extends State {
    enter(owner) {
        console.log("----------------------------------");
        owner.IDLE_TIMER = 0;
        owner.IDLE_TIMER_LENGTH = 1000;
    }

    execute(owner) {
        owner.IDLE_TIMER += Config.updateRate;
        if (owner.IDLE_TIMER > owner.IDLE_TIMER_LENGTH) {
            owner._stateMachine.changeTo("PATROL");
            return false;
        }
        console.log("[IdleState] idle entity", owner.IDLE_TIMER, owner.IDLE_TIMER_LENGTH);
    }

    exit(owner) {}
}

export default IdleState;
