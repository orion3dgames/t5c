import Config from "../../../../shared/Config";
import { EntityState } from "../../../../shared/Entities/Entity/EntityState";
import { State } from "../../../../shared/yuka";

class DeadState extends State {
    enter(owner) {
        console.log("[DeadState] ----------------------------------");
        owner.health = 0;
        owner.blocked = true;
        owner.anim_state = EntityState.DEAD;
        owner.isDead = true;
        owner.resetDestination();
    }

    execute(owner) {
        console.log("[DeadState]");

        owner.DEAD_TIMER += 100;

        // delete so entity can be respawned
        if (owner.DEAD_TIMER > 5000) {
            // remove entity
            owner._gameroom// remove schema
            .owner._gameroom.state.entities
                .delete(owner.sessionId);
        }
    }

    exit(owner) {}
}

export default DeadState;
