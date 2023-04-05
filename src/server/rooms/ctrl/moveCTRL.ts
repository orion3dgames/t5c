import Logger from "../../../shared/Logger";
import { Vector3 } from "../../../shared/yuka";
import { PlayerInputs } from "../../../shared/Types";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { EnemyState } from "../schema/EnemyState";
import { LootState } from "../schema/LootState";

export class moveCTRL {
    private _owner;

    constructor(owner) {
        this._owner = owner;
    }

    public update() {
        // if player has a target, monitor it's position.
        this._owner.monitorTarget();

        // if player has a target, start heading towards it.
        // once you get to it start auto attacking
        // autoattack stop if casting, moving, dying
        if (this._owner.hasTarget()) {
            let start = this._owner.getPosition();
            let destination = this._owner.AI_CURRENT_TARGET_POSITION;
            let distance = this._owner.AI_CURRENT_TARGET_DISTANCE;
            if (distance < 3) {
                let ability = this._owner.AI_CURRENT_ABILITY;
                let target = this._owner.AI_CURRENT_TARGET;
                if (target instanceof EnemyState) {
                    this._owner.abilitiesCTRL.startAutoAttack(this._owner, target, ability);
                }
                if (target instanceof LootState) {
                    this._owner.addItemToInventory(target);
                }
                this._owner.AI_CURRENT_TARGET = null;
                this._owner.AI_CURRENT_ABILITY = null;
            } else {
                this._owner.rot = this.calculateRotation(start, destination);
                this.setPosition(this.moveTo(start, destination, this._owner.speed));
            }
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
     * Check if player can move from sourcePos to newPos
     * @param {Vector3} sourcePos source position
     * @param {Vector3} newPos destination position
     * @returns boolean
     */
    canMoveTo(sourcePos: Vector3, newPos: Vector3): boolean {
        return this._owner._gameroom._navMesh.checkPath(sourcePos, newPos);
    }

    /**
     * Calculate next forward position on the navmesh based on playerInput forces
     * @param {PlayerInputs} playerInput
     * @returns
     */
    processPlayerInput(playerInput: PlayerInputs) {
        if (this._owner.blocked && !this._owner.isDead) {
            this._owner.state = EntityCurrentState.IDLE;
            Logger.warning("Player " + this._owner.name + " is blocked, no movement will be processed");
            return false;
        }

        this._owner.abilitiesCTRL.cancelAutoAttack(this);

        let speed = this._owner.speed;

        // save current position
        let oldX = this._owner.x;
        let oldY = this._owner.y;
        let oldZ = this._owner.z;
        let oldRot = this._owner.rot;

        // calculate new position
        let newX = this._owner.x - playerInput.h * speed;
        let newY = this._owner.y;
        let newZ = this._owner.z - playerInput.v * speed;
        let newRot = Math.atan2(playerInput.h, playerInput.v);

        // check if destination is in navmesh
        let sourcePos = new Vector3(oldX, oldY, oldZ); // new pos
        let destinationPos = new Vector3(newX, newY, newZ); // new pos
        const foundPath: any = this._owner._navMesh.checkPath(sourcePos, destinationPos);
        if (foundPath) {
            /*
            // adjust height of the entity according to the ground
            let currentRegion = this._navMesh.getClosestRegion( destinationPos );
            const distance = currentRegion.plane.distanceToPoint( sourcePos );
            let newY = distance * 0.2; // smooth transition
            */

            // next position validated, update player
            this._owner.x = newX;
            this._owner.y = newY;
            this._owner.z = newZ;
            this._owner.rot = newRot;
            this._owner.sequence = playerInput.seq;
            this._owner.isMoving = true;
            this._owner.state = EntityCurrentState.WALKING;

            Logger.info(
                "Valid position for " +
                    this._owner.name +
                    ": ( x: " +
                    this._owner.x +
                    ", y: " +
                    this._owner.y +
                    ", z: " +
                    this._owner.z +
                    ", rot: " +
                    this._owner.rot
            );
        } else {
            // collision detected, return player old position
            this._owner.x = oldX;
            this._owner.y = 0;
            this._owner.z = oldZ;
            this._owner.rot = oldRot;
            this._owner.sequence = playerInput.seq;
            this._owner.state = EntityCurrentState.IDLE;

            Logger.warning(
                "Invalid position for " +
                    this._owner.name +
                    ": ( x: " +
                    this._owner.x +
                    ", y: " +
                    this._owner.y +
                    ", z: " +
                    this._owner.z +
                    ", rot: " +
                    this._owner.rot
            );
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

        return newPos;
    }
}
