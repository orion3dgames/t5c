import Config from "../../../../shared/Config";
import { EntityState } from "../../../../shared/Entities/Entity/EntityState";
import { State } from "../../../../shared/yuka";

class PatrolState extends State {
    enter(owner) {
        console.log("----------------------------------");

        // cancel any targets
        owner.resetDestination();

        // find a destination
        owner.setRandomDestination(owner.getPosition());
    }

    execute(owner) {
        // set animation state
        // todo: not sure if I actually need this
        owner.anim_state = EntityState.WALKING;

        // once arrive at destination, stay idle a while
        if (owner.AI_TARGET_WAYPOINTS.length < 1) {
            owner._stateMachine.changeTo("IDLE");
            return false;
        }

        // if there is a closest player, and in aggro range
        if (owner.isAnyPlayerInAggroRange()) {
            owner.setPlayerTarget(owner.AI_CLOSEST_PLAYER);
        }

        // if entity has a target, start searching for it
        if (owner.hasValidTarget()) {
            owner._stateMachine.changeTo("CHASE");
            return false;
        }

        // move to destination
        owner.moveTowards();

        // debug
        console.log("[PatrolState] move to ", owner.x, owner.y, owner.z);
    }

    exit(owner) {}
}

export default PatrolState;
