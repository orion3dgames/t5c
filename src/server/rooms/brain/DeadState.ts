import { EntityState, AI_STATE } from "../../../shared/types";
import { State } from "../brain/StateManager";

class DeadState extends State {
    enter(owner) {
        //console.log("[DeadState] ----------------------------------");
        owner.health = 0;
        owner.blocked = true;
        owner.anim_state = EntityState.DEAD;
        owner.ai_state = AI_STATE.IDLE;
        owner.isDead = true;
        owner.resetDestination();
    }

    execute(owner) {
        //console.log("[DeadState]");

        owner.DEAD_TIMER += 100;

        // delete so entity can be respawned
        if (owner.DEAD_TIMER > 5000) {
            // remove entity
            owner._state.spawnCTRL.removeEntity(owner);
        }
    }

    exit(owner) {}
}

export default DeadState;
