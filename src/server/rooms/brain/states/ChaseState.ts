import Config from "../../../../shared/Config";
import { EntityState } from "../../../../shared/Entities/Entity/EntityState";
import { State } from "../../../../shared/yuka";

class ChaseState extends State {
    enter(owner) {
        console.log("----------------------------------");

        // set chase timer
        owner.CHASE_TIMER = 0;

        // set target
        if (owner.AI_TARGET_WAYPOINTS.length < 1 && owner.AI_TARGET !== null) {
            owner.setTargetDestination(owner.AI_TARGET.getPosition());
        }
    }

    execute(owner) {
        owner.CHASE_TIMER += Config.updateRate;

        // if target is dead or invalid
        if (owner.AI_TARGET === null || owner.AI_TARGET === undefined || owner.AI_TARGET === false || owner.AI_TARGET.isEntityDead()) {
            owner._stateMachine.changeTo("PATROL");
            console.log("[ChaseState] invalid target");
            return false;
        }

        // if entity has been chasing for longer than Config.MONSTER_SEARCHING_PERIOD
        if (owner.CHASE_TIMER > Config.MONSTER_CHASE_PERIOD) {
            owner._stateMachine.changeTo("PATROL");
            console.log("[ChaseState] target lost");
            return false;
        }

        // if entity is close enough to player, start attacking it
        if (owner.AI_TARGET_DISTANCE < Config.MONSTER_ATTACK_DISTANCE) {
            owner._stateMachine.changeTo("ATTACK");
            console.log("[ChaseState] target found and is close enough");
            return false;
        }

        // if player come back into range, reset chase timer
        if (owner.AI_TARGET_DISTANCE < Config.MONSTER_AGGRO_DISTANCE) {
            owner.CHASE_TIMER = 0;
            console.log("[ChaseState] target found again");
        }

        // if target has moved, keep searching for target
        if (owner.AI_TARGET_WAYPOINTS.length < 1 && owner.AI_TARGET !== null) {
            owner.setTargetDestination(owner.AI_TARGET.getPosition());
            console.log("[ChaseState] target not a previous location, search again");
        }

        // else keep moving towards target
        owner.moveTowards();

        // debug
        console.log("[ChaseState] chasing entity", owner.CHASE_TIMER);
    }

    exit(owner) {}
}

export default ChaseState;
