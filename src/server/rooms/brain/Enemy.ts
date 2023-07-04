import { dataDB } from "../../../shared/Data/dataDB";
import { Vehicle, StateMachine, Vector3 } from "../../../shared/yuka";
import { abilitiesCTRL } from "../controllers/abilityCTRL";
import { AbilitySchema } from "../schema/AbilitySchema";
import { IdleState, PatrolState, ChaseState } from "../brain/states";
import Config from "../../../shared/Config";
import { EntityState } from "../../../shared/Entities/Entity/EntityState";

class Enemy extends Vehicle {
    public _navMesh;
    public _gameroom;
    public _stateMachine;
    public _schema;
    public _vehicle;

    public type;
    public sessionId;
    public x;
    public y;
    public z;
    public rot;
    public anim_state;

    public name;
    public race;
    public manaRegen: number = 0;
    public healthRegen: number = 0;
    public speed: number = 0;
    public experienceGain: number = 0;
    public isMoving: boolean = false;
    public isDead: boolean = false;
    public raceData;
    public client;

    public abilitiesCTRL: abilitiesCTRL;
    public abilities: AbilitySchema[] = [];
    public default_abilities;

    // TIMERS
    public IDLE_TIMER = 0;
    public IDLE_TIMER_LENGTH = 0;

    public CHASE_TIMER = 0;

    // AI
    public AI_CURRENT_STATE;
    public AI_TARGET = null;
    public AI_TARGET_WAYPOINTS = [];
    public AI_TARGET_DISTANCE = null;

    public AI_CLOSEST_PLAYER = null;
    public AI_CLOSEST_PLAYER_DISTANCE = null;

    constructor(gameroom, schema, data, ...args: any[]) {
        super();

        // variables
        this._navMesh = gameroom.navMesh;
        this._gameroom = gameroom;
        this._schema = schema;

        // assign data
        Object.assign(this, data);
        Object.assign(this, dataDB.get("race", this.race));

        // abilities
        this.default_abilities.forEach((element) => {
            this.abilities.push(new AbilitySchema({ key: element, digit: 1 }));
        });
        this.abilitiesCTRL = new abilitiesCTRL(this);

        // start state machine
        this._stateMachine = new StateMachine(this);
        this._stateMachine.add("IDLE", new IdleState());
        this._stateMachine.add("PATROL", new PatrolState());
        this._stateMachine.add("CHASE", new ChaseState());
        this._stateMachine.changeTo("IDLE");
    }

    // entity update
    update(delta) {
        /////////////////////////////////////////////////////////////////
        // if players are connected, start monitoring them
        if (this._gameroom.entities.size > 0) {
            // if does not have a target, keep monitoring the closest player
            if (this.AI_TARGET === null || this.AI_TARGET === undefined) {
                this.findClosestEntity();
            }

            // if entity has a target, monitor it's position
            if (this.AI_TARGET != null && this.AI_TARGET !== undefined) {
                this.monitorTarget();
            }
        }

        // update state machine
        this._stateMachine.update();

        // do whatever YUKA does
        super.update(delta);

        // update COLYSEUS schema
        this.syncUpdate();
    }

    // send updates to colyseus schema
    syncUpdate() {
        let update = {
            race: this.race,
            x: this.x,
            y: this.y,
            z: this.z,
        };
        for (const key in update) {
            this._schema[key] = update[key];
        }
        //console.log("[ENTITY] syncUpdate to colyseus", update);
    }

    isAnyPlayerInAggroRange() {
        if (this.AI_CLOSEST_PLAYER_DISTANCE != null && this.AI_CLOSEST_PLAYER_DISTANCE < Config.MONSTER_AGGRO_DISTANCE) {
            return true;
        }
        return false;
    }

    hasValidTarget() {
        return this.AI_TARGET && this.AI_TARGET.sessionId;
    }

    setPlayerTarget(target) {
        // set target
        this.AI_TARGET = target;
        // reset closest player to null and
        this.AI_CLOSEST_PLAYER = null;
        this.AI_CLOSEST_PLAYER_DISTANCE = null;
        console.log("FOUND CLOSEST PLAYER", target.sessionId);
    }

    // get position vector
    getPosition() {
        return new Vector3(this.x, this.y, this.z);
    }

    // set position vector
    setPosition(updatedPos: Vector3): void {
        this.x = updatedPos.x;
        this.y = updatedPos.y;
        this.z = updatedPos.z;
    }

    /**
     * Calculate rotation based on moving from v1 to v2
     * @param {Vector3} v1
     * @param {Vector3} v2
     * @returns rotation in radians
     */
    rotateTowards(v1: Vector3, v2: Vector3): number {
        return Math.atan2(v1.x - v2.x, v1.z - v2.z);
    }

    /**
     * Finds a new random valid position on navmesh and sets is as the new destination for this entity
     * @param {Vector3} currentPos
     */
    setRandomDestination(currentPos: Vector3): void {
        let randomPoint = this._gameroom.navMesh.getRandomRegion();
        this.AI_TARGET_WAYPOINTS = this._gameroom.navMesh.findPath(currentPos, randomPoint.centroid);
        if (this.AI_TARGET_WAYPOINTS.length === 0) {
            this.AI_TARGET_WAYPOINTS = [];
        }
    }

    moveTowards(type: string = "seek") {
        this.anim_state = EntityState.WALKING;
        // move entity
        if (this.AI_TARGET_WAYPOINTS.length > 0) {
            let currentPos = this.getPosition();
            // get next waypoint
            let destinationOnPath = this.AI_TARGET_WAYPOINTS[0];
            destinationOnPath.y = 0;

            // calculate next position towards destination
            let updatedPos = this.moveTo(currentPos, destinationOnPath, this.speed);
            this.setPosition(updatedPos);

            // calculate rotation
            this.rot = this.rotateTowards(currentPos, updatedPos);

            // check if arrived at waypoint
            if (destinationOnPath.equals(updatedPos)) {
                this.AI_TARGET_WAYPOINTS.shift();
            }
        } else {
            // something is wrong, let's look for a new destination
            this.resetDestination();
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
        speed = 3;
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

    /**
     * entity must always know the closest player at all times
     */
    findClosestEntity() {
        let closestDistance = 1000000;
        this._gameroom.getEntities().forEach((entity) => {
            if (this.type === "entity" && entity.sessionId != this.sessionId && !entity.isDead) {
                let playerPos = entity.getPosition();
                let entityPos = this.getPosition();
                let distanceBetween = entityPos.distanceTo(playerPos);
                if (distanceBetween < closestDistance) {
                    closestDistance = distanceBetween;
                    this.AI_CLOSEST_PLAYER = entity;
                    this.AI_CLOSEST_PLAYER_DISTANCE = distanceBetween;
                }
            }
        });
        console.log("FIND CLOSEST ENTITY", this.AI_CLOSEST_PLAYER_DISTANCE);
    }

    /**
     * entity must always know the closest player at all times
     */
    findClosestPlayer() {
        let closestDistance = 1000000;
        this._gameroom.state.players.forEach((entity) => {
            if (this.type === "entity" && entity.type === "player" && !entity.gracePeriod && !entity.isDead) {
                let playerPos = entity.getPosition();
                let entityPos = this.getPosition();
                let distanceBetween = entityPos.distanceTo(playerPos);
                if (distanceBetween < closestDistance) {
                    closestDistance = distanceBetween;
                    this.AI_CLOSEST_PLAYER = entity;
                    this.AI_CLOSEST_PLAYER_DISTANCE = distanceBetween;
                }
            }
        });
    }

    /**
     * monitor a target
     */
    monitorTarget() {
        if (this.AI_TARGET !== null && this.AI_TARGET !== undefined) {
            let targetPos = this.AI_TARGET.getPosition();
            let entityPos = this.getPosition();
            let distanceBetween = entityPos.distanceTo(targetPos);
            this.AI_TARGET_DISTANCE = distanceBetween;
        }
    }

    resetDestination(): void {
        this.AI_TARGET = null;
        this.AI_TARGET_WAYPOINTS = [];
        this.AI_TARGET_DISTANCE = null;
        console.log("resetDestination()", this.AI_TARGET, this.AI_TARGET_WAYPOINTS);
    }
}

export { Enemy };
