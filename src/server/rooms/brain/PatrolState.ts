import { EntityState, AI_STATE } from "../../../shared/types";
import { Vector3 } from "../../../shared/Libs/yuka-min";
import { State } from "../brain/StateManager";
import { BrainSchema } from "../schema";

/**
 * type: global, area, path, point
 * behaviour: patrol, idle
 */

function getRandomPoint(positions: Array<Vector3>) {
    let randPos = positions[Math.floor(Math.random() * positions.length)];
    return new Vector3(randPos.x, randPos.y, randPos.z);
}

function createRandomPath(positions: Array<Vector3>) {
    return [getRandomPoint(positions)];
}

function createPath(owner, positions: Array<Vector3>) {
    let startPos = owner.getPosition();
    let path = [];
    positions.forEach((pos: Vector3) => {
        let destPos = new Vector3(pos.x, pos.y, pos.z);
        let waypoints = owner._state.navMesh.findPath(startPos, destPos);
        if (waypoints.length > 0) {
            waypoints.forEach((w) => {
                path.push(new Vector3(w.x, w.y, w.z));
            });
        }
        startPos = destPos;
    });
    return path;
}

class PatrolState extends State {
    enter(owner: BrainSchema) {
        //console.log("[PatrolState] ----------------------------------");

        // cancel any targets
        owner.resetDestination();

        // find a destination
        if (owner.AI_SPAWN_INFO.type == "global") {
            owner.setRandomDestination(owner.getPosition());
        }
        if (owner.AI_SPAWN_INFO.type == "area") {
            owner.AI_TARGET_WAYPOINTS = createRandomPath(owner.AI_SPAWN_INFO.points);
        }
        if (owner.AI_SPAWN_INFO.type == "path") {
            owner.AI_TARGET_WAYPOINTS = createPath(owner, owner.AI_SPAWN_INFO.points);
        }
        if (owner.AI_SPAWN_INFO.type == "static") {
            owner._stateMachine.changeTo("IDLE");
        }

        owner.ai_state = AI_STATE.WANDER;
    }

    execute(owner: BrainSchema) {
        // set animation state
        // todo: not sure if I actually need this
        owner.anim_state = EntityState.WALKING;

        // once arrive at destination, stay idle a while
        if (owner.AI_TARGET_WAYPOINTS.length < 1) {
            owner._stateMachine.changeTo("IDLE");
            return false;
        }

        // if there is a closest player, and in aggro range
        if (owner.isAnyPlayerInAggroRange() && owner.AI_SPAWN_INFO.aggressive === true) {
            owner.setPlayerTarget(owner.AI_CLOSEST_PLAYER);
        }

        // if entity has a target, start searching for it
        if (owner.hasValidTarget() && owner.AI_SPAWN_INFO.aggressive === true) {
            owner._stateMachine.changeTo("CHASE");
            return false;
        }

        // add 10% chance of AI of breaking patrol and slacking off :)
        if (Math.random() > 0.99) {
            owner._stateMachine.changeTo("IDLE");
            return false;
        }

        // move to destination
        owner.moveTowards();

        // debug
        //console.log("[PatrolState] move to ", owner.x, owner.y, owner.z);
    }

    exit(owner) {}
}

export default PatrolState;
