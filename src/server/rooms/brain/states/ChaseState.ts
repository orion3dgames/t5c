import Config from "../../../../shared/Config";
import { EntityState } from "../../../../shared/Entities/Entity/EntityState";
import { State } from "../../../../shared/yuka";

class ChaseState extends State {
    enter(owner) {
        console.log("----------------------------------");
        owner.CHASE_TIMER = 0;
    }

    execute(owner) {
        owner.CHASE_TIMER += Config.updateRate;
        if (owner.CHASE_TIMER > Config.MONSTER_SEARCHING_PERIOD) {
            owner._stateMachine.changeTo("PATROL");
        }
        console.log("[ChaseState] chasing entity", owner.CHASE_TIMER);
    }

    exit(owner) {
        owner.resetDestination();
    }
}

export default ChaseState;
