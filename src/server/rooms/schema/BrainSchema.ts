import { type, ArraySchema, MapSchema } from "@colyseus/schema";
import { EntityState, AI_STATE } from "../../../shared/types";
import { Entity } from "./Entity";
import { abilitiesCTRL } from "../controllers/abilityCTRL";
import { AbilitySchema } from "../schema/player/AbilitySchema";
import { IdleState, PatrolState, ChaseState, AttackState, DeadState } from "../brain";
import { StateManager } from "../brain/StateManager";
import { Vector3 } from "../../../shared/Libs/yuka-min";
import { randomNumberInRange } from "../../../shared/Utils";
import { EquipmentSchema } from "./player/EquipmentSchema";
import { GameRoomState } from "../state/GameRoomState";
import { animationCTRL } from "../controllers/animationCTRL";

export class BrainSchema extends Entity {
    /////////////////////////////////////////////////////////////
    // the below will be synced to all the players
    @type("number") public x: number = 0;
    @type("number") public y: number = 0;
    @type("number") public z: number = 0;
    @type("number") public rot: number = 0;

    @type("int16") public health: number = 0;
    @type("int16") public maxHealth: number = 0;
    @type("int16") public mana: number = 0;
    @type("int16") public maxMana: number = 0;
    @type("uint8") public level: number = 0;

    @type("string") public type: string = "";
    @type("string") public name: string = "";
    @type("string") public race: string = "";
    @type("string") public head: string = "Head_Base";
    @type("int8") public material: number = 0;

    @type("string") public location: string = "";
    @type("number") public sequence: number = 0; // latest input sequence
    @type("boolean") public blocked: boolean = false; // if true, used to block player and to prevent movement
    @type("int8") public anim_state: EntityState = EntityState.IDLE;
    @type("number") public ai_state: AI_STATE = 0;
    @type("number") public spawn_id = 0;

    @type({ map: EquipmentSchema }) equipment = new MapSchema<EquipmentSchema>();

    // PARENTS
    public _navMesh;
    public _state: GameRoomState;
    public _stateMachine: StateManager;

    // LOCAL VARS
    public manaRegen: number = 0;
    public healthRegen: number = 0;
    public speed: number = 0;
    public experienceGain: number = 0;
    public isMoving: boolean = false;
    public isDead: boolean = false;
    public raceData;
    public client;

    // CTRL
    public abilitiesCTRL: abilitiesCTRL;
    public animationCTRL: animationCTRL;
    public abilities: AbilitySchema[] = [];
    public default_abilities;

    // TIMERS
    public spawnTimer: number = 0;
    public IDLE_TIMER = 0;
    public IDLE_TIMER_LENGTH = 0;
    public CHASE_TIMER = 0;
    public ATTACK_TIMER = 0;
    public ATTACK_ISINTERVAL = false;
    public DEAD_TIMER = 0;

    // AI
    public AI_TARGET = null;
    public AI_TARGET_WAYPOINTS = [];
    public AI_TARGET_DISTANCE = null;
    public AI_CLOSEST_PLAYER = null;
    public AI_CLOSEST_PLAYER_DISTANCE = null;
    public AI_SPAWN_INFO = null;
    public AI_TARGET_SPOT = null;

    constructor(state, data, ...args: any[]) {
        super();

        // variables
        this._navMesh = state._gameroom.navMesh;
        this._state = state;

        // assign default data
        Object.assign(this, this._state.gameData.get("race", data.race));

        // assign spawn data
        Object.assign(this, data);

        // add equipment
        if (data.initial_equipment && data.initial_equipment.length > 0) {
            data.initial_equipment.forEach((element) => {
                this.equipment.set(element.key, new EquipmentSchema(element, this));
            });
        }

        // set controllers
        this.abilitiesCTRL = new abilitiesCTRL(this);
        this.animationCTRL = new animationCTRL(this);

        // initialize state machine
        this._stateMachine = new StateManager(this);
        this._stateMachine.add("IDLE", new IdleState());
        this._stateMachine.add("PATROL", new PatrolState());
        this._stateMachine.add("CHASE", new ChaseState());
        this._stateMachine.add("ATTACK", new AttackState());
        this._stateMachine.add("DEAD", new DeadState());

        // initial state
        this._stateMachine.changeTo("IDLE");
    }

    // entity update
    public update(delta) {
        /////////////////////////////////////////////////////////////////
        // if players are connected, start monitoring them
        if (this.isEntityDead() && !this.isDead) {
            //this._stateMachine.changeTo("DEAD");
        }

        // if does not have a target, keep monitoring the closest player
        if (this.AI_TARGET === null || this.AI_TARGET === undefined) {
            this.findClosestPlayer();
        }
        // if entity has a target, monitor it's position
        if (this.AI_TARGET != null && this.AI_TARGET !== undefined) {
            this.monitorTarget();
        }

        // update state machine
        this._stateMachine.update();
    }

    isAnyPlayerInAggroRange() {
        if (this.AI_CLOSEST_PLAYER_DISTANCE != null && this.AI_CLOSEST_PLAYER_DISTANCE < this._state.config.MONSTER_AGGRO_DISTANCE) {
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
        let randomPoint = this._state.navMesh.getRandomRegion();
        this.AI_TARGET_WAYPOINTS = this._state.navMesh.findPath(currentPos, randomPoint.centroid);
        if (this.AI_TARGET_WAYPOINTS.length === 0) {
            this.AI_TARGET_WAYPOINTS = [];
        }
    }

    moveTowards(type: string = "seek") {
        this.anim_state = EntityState.WALKING;
        // move entity
        if (this.AI_TARGET_WAYPOINTS.length > 0) {
            // todo: fix a bug here
            //if (this.AI_TARGET_WAYPOINTS[0] instanceof Vector3) {
            let currentPos = this.getPosition();

            // get next waypoint
            let destinationOnPath = this.AI_TARGET_WAYPOINTS[0];

            // calculate next position towards destination
            let updatedPos = this.moveTo(currentPos, destinationOnPath, this.speed);
            this.setPosition(updatedPos);

            // calculate rotation
            this.rot = this.rotateTowards(currentPos, updatedPos);

            // check if arrived at waypoint
            if (destinationOnPath.distanceTo(updatedPos) < 1) {
                this.AI_TARGET_WAYPOINTS.shift();
            }
            //}
        } else {
            console.error("moveTowards failed");
            // something is wrong, let's look for a new destination
            //this.resetDestination();
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

        // X
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

        // Z
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
        let currentRegion = this._navMesh.getRegionForPoint(newPos, 5);
        if (currentRegion) {
            let distance = currentRegion.plane.distanceToPoint(newPos);
            newPos.y -= distance;
        }

        return newPos;
    }

    /**
     * entity must always know the closest player at all times
     * todo: should not iterate over all entities just to find players?
     */
    findClosestPlayer() {
        let closestDistance = 1000000;
        this._state.entities.forEach((entity: any) => {
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

    /**
     * Finds a valid position on navmesh matching targetPos and sets is as the new destination for this entity
     * @param {Vector3} targetPos
     */
    setTargetDestination(targetPos: Vector3): void {
        console.log("[setTargetDestination]", this.AI_TARGET_WAYPOINTS);
        this.AI_TARGET_WAYPOINTS = this._state.navMesh.findPath(this.getPosition(), targetPos);
        if (this.AI_TARGET_WAYPOINTS.length === 0) {
            this.AI_TARGET_WAYPOINTS = [];
        }
    }

    setTarget(target) {
        this.AI_TARGET = target;
    }

    resetDestination(): void {
        this.AI_TARGET = null;
        this.AI_TARGET_WAYPOINTS = [];
        this.AI_TARGET_DISTANCE = null;
        //console.log("resetDestination()", this.AI_TARGET, this.AI_TARGET_WAYPOINTS);
    }

    // make sure no value are out of range
    normalizeStats() {
        // health
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        }
        if (this.health < 0) {
            this.health = 0;
        }

        // mana
        if (this.mana > this.maxMana) {
            this.mana = this.maxMana;
        }
        if (this.mana < 0) {
            this.mana = 0;
        }
    }

    setAsDead() {
        console.log("setAsDead", "SET AS DEAD", this.sessionId);
        this._stateMachine.changeTo("DEAD");
    }

    isEntityDead() {
        return this.health <= 0;
    }

    calculateDamage(owner, target) {
        return randomNumberInRange(5, 10);
    }
}
