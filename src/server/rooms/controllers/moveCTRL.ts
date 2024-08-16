import Logger from "../../utils/Logger";
import { Vector3 } from "../../../shared/Libs/yuka-min";
import { EntityState, PlayerInputs } from "../../../shared/types";
import { BrainSchema, LootSchema, PlayerSchema } from "../schema";

export class moveCTRL {
    private _owner: PlayerSchema;

    private currentRegion;

    constructor(owner) {
        this._owner = owner;
    }

    public update() {
        // if player has a target
        if (this._owner.hasTarget()) {
            // monitor player's target position
            this._owner.monitorTarget();

            // find the path to target position
            if (this._owner.AI_TARGET_WAYPOINTS.length < 1) {
                this.setTargetDestination(this._owner.AI_TARGET_POSITION);
            }

            // check distance to target
            let distance = this._owner.AI_TARGET_DISTANCE;
            let target = this._owner.AI_TARGET;
            let ability = this._owner.AI_ABILITY;

            // do pickup item if close enough
            if (distance < 1 && target instanceof LootSchema) {
                this._owner.pickupItem(target);
                this._owner.AI_TARGET = null;
                this.cancelTargetDestination();
            }

            // do auto attack
            if (this._owner.AI_ABILITY && (target instanceof BrainSchema || target instanceof PlayerSchema)) {
                if (distance <= ability.minRange) {
                    // cast ability
                    this._owner.abilitiesCTRL.cast(this._owner, target, ability, 1);

                    // if ai entity
                    if (target instanceof BrainSchema) {
                        this._owner.AI_TARGET = null;
                    }

                    // if player entity
                    if (target instanceof PlayerSchema) {
                        this._owner.AI_TARGET_FOUND = true;
                    }

                    this.cancelTargetDestination();
                }
            }

            // if already found and target escapes
            if (distance > 2.5 && this._owner.AI_TARGET_FOUND) {
                //this._owner.abilitiesCTRL.cancelAutoAttack(this._owner);
                this._owner.AI_TARGET = null;
                this._owner.AI_TARGET_FOUND = false;
            }
        }

        // head towards next waypoint
        if (this._owner.AI_TARGET_WAYPOINTS && this._owner.AI_TARGET_WAYPOINTS.length > 0) {
            this.moveTowards();
        }
    }

    cancelTargetDestination() {
        this._owner.AI_TARGET_WAYPOINTS = [];
        this._owner.AI_TARGET_DISTANCE = 0;
        this._owner.AI_TARGET_POSITION = null;
        this._owner.AI_ABILITY = null;
    }

    setTargetDestination(targetPos: Vector3): void {
        const foundPath: any = this._owner._navMesh.checkPath(this._owner.getPosition(), targetPos);
        if (foundPath) {
            this._owner.AI_TARGET_WAYPOINTS = this._owner._navMesh.findPath(this._owner.getPosition(), targetPos);
            this._owner.AI_TARGET_WAYPOINTS.push(targetPos);
        }
    }

    moveTowards(type: string = "seek") {
        // move entity
        if (this._owner.AI_TARGET_WAYPOINTS.length > 0) {
            let currentPos = this._owner.getPosition();

            // get next waypoint
            let destinationOnPath = this._owner.AI_TARGET_WAYPOINTS[0];

            // calculate next position towards destination
            let updatedPos = this.moveTo(currentPos, destinationOnPath, this._owner.speed);
            this.setPosition(updatedPos);

            // calculate rotation
            this._owner.rot = this.calculateRotation(currentPos, updatedPos);

            // check if arrived at waypoint
            if (destinationOnPath.distanceTo(updatedPos) < 1) {
                this._owner.AI_TARGET_WAYPOINTS.shift();
            }
        } else {
            console.error("moveTowards failed");
            // something is wrong, let's look for a new destination
            //this.resetDestination();
        }
    }

    /**
     * Calculate rotation based on moving from v1 to v2
     * @param {Vector3} v1
     * @param {Vector3} v2
     * @returns rotation in radians
     */
    calculateRotation(v1: Vector3, v2: Vector3): number {
        return Math.atan2(v1.x - v2.x, v1.z - v2.z);
    }

    setPosition(updatedPos: Vector3): void {
        this._owner.x = updatedPos.x;
        this._owner.y = updatedPos.y;
        this._owner.z = updatedPos.z;
    }

    /**
     * Calculate next forward position on the navmesh based on playerInput forces
     * @param {PlayerInputs} playerInput
     * @returns
     */
    processPlayerInput(playerInput: PlayerInputs) {
        if (this._owner.blocked && !this._owner.isDead) {
            //this._owner.state = EntityState.IDLE;
            Logger.warning("Player " + this._owner.name + " is blocked, no movement will be processed");
            return false;
        }

        // make not already moving somewhere
        if (this._owner.AI_TARGET_WAYPOINTS.length > 0) {
            this._owner.AI_TARGET = null;
            this._owner.AI_TARGET_WAYPOINTS = [];
        }

        // cancel any auto attack
        //this._owner.abilitiesCTRL.cancelAutoAttack(this._owner);
        let speed = this._owner.speed;

        // save current position
        let oldX = this._owner.x;
        let oldY = this._owner.y;
        let oldZ = this._owner.z;
        let oldRot = this._owner.rot;

        // calculate new position
        let newX = this._owner.x - playerInput.h * speed;
        let newY = oldY;
        let newZ = this._owner.z - playerInput.v * speed;
        let newRot = Math.atan2(playerInput.h, playerInput.v);

        // check if destination is in navmesh
        let sourcePos = new Vector3(oldX, oldY, oldZ); // new pos
        let destinationPos = new Vector3(newX, newY, newZ); // new pos

        // get clamped position
        let clampedPosition = this._owner._navMesh.clampMovementV2(sourcePos, destinationPos) as Vector3;

        // collision detected, return player old position
        this._owner.x = clampedPosition.x;
        this._owner.y = clampedPosition.y;
        this._owner.z = clampedPosition.z;
        this._owner.rot = newRot;
        this._owner.sequence = playerInput.seq;

        //
        let nextRegion = this._owner._navMesh.getRegionForPoint(clampedPosition, 0.5);
        if (nextRegion && nextRegion.plane) {
            const distance = nextRegion.plane.distanceToPoint(clampedPosition);
            newY -= distance; // smooth transition
        }
    }

    /**
     * Move entity toward a Vector3 position
     * @param {Vector3} source
     * @param {Vector3} destination
     * @param {number} speed movement speed
     * @returns {Vector3} new position
     */
    moveTo(source: Vector3, destination: Vector3, speed: number): Vector3 {
        let currentX = source.x;
        let currentZ = source.z;
        let targetX = destination.x;
        let targetZ = destination.z;
        let newPos = new Vector3(source.x, source.y, source.z);

        if (targetX < currentX) {
            newPos.x -= speed;
            if (newPos.x < targetX) {
                newPos.x = targetX;
            }
        }

        if (targetX > currentX) {
            newPos.x += speed;
            if (newPos.x > targetX) {
                newPos.x = targetX;
            }
        }

        if (targetZ < currentZ) {
            newPos.z -= speed;
            if (newPos.z < targetZ) {
                newPos.z = targetZ;
            }
        }

        if (targetZ > currentZ) {
            newPos.z += speed;
            if (newPos.z > targetZ) {
                newPos.z = targetZ;
            }
        }

        // adjust height of the entity according to the ground
        // todo: improve performance here
        // adjust y position of the player according to the navmesh
        let currentRegion = this._owner._navMesh.getRegionForPoint(newPos, 0.5);
        if (currentRegion && currentRegion.plane) {
            const distance = currentRegion.plane.distanceToPoint(newPos);
            newPos.y -= distance; // smooth transition*/
        }

        return newPos;
    }
}
