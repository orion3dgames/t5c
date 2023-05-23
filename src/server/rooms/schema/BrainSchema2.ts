import { Schema, type } from "@colyseus/schema";
import { EntityState } from "../../../shared/Entities/Entity/EntityState";
import { AI_STATE } from "../../../shared/Entities/Entity/AIState";
import { NavMesh, Vector3 } from "../../../shared/yuka";
import { dataDB } from "../../../shared/Data/dataDB";
import { abilitiesCTRL } from "../controllers/abilityCTRL";
import { AbilitySchema } from "./AbilitySchema";

import StateMachine from "../brain/StateMachine";
import PatrolState from "../brain/PatrolState";

import Config from "../../../shared/Config";

export class BrainSchema2 extends Schema {
    /////////////////////////////////////////////////////////////
    // the below will be synced to all the players
    @type("number") public id: number = 0;
    @type("number") public x: number = 0;
    @type("number") public y: number = 0;
    @type("number") public z: number = 0;
    @type("number") public rot: number = 0;

    @type("int16") public health: number = 0;
    @type("int16") public maxHealth: number = 0;
    @type("int16") public mana: number = 0;
    @type("int16") public maxMana: number = 0;
    @type("uint8") public level: number = 0;

    @type("string") public sessionId: string;
    @type("string") public name: string = "";
    @type("string") public type: string = "player";
    @type("string") public race: string = "player_hobbit";

    @type("string") public location: string = "";
    @type("number") public sequence: number = 0; // latest input sequence
    @type("boolean") public blocked: boolean = false; // if true, used to block player and to prevent movement
    @type("int8") public anim_state: EntityState = EntityState.IDLE;
    @type("number") public AI_CURRENT_STATE: AI_STATE = 0;

    public manaRegen: number = 0;
    public healthRegen: number = 0;
    public speed: number = 0;
    public experienceGain: number = 0;
    public isMoving: boolean = false;
    public isDead: boolean = false;

    public _navMesh: NavMesh;
    public _gameroom;
    public raceData;
    public client;

    public abilitiesCTRL: abilitiesCTRL;
    public abilities: AbilitySchema[] = [];
    public default_abilities;

    public stateMachine: StateMachine;
    public velocity: Vector3 = new Vector3();

    public AI_CLOSEST_PLAYER = null;
    public AI_CLOSEST_PLAYER_DISTANCE = null;
    public AI_VELOCITY;
    public AI_TARGET = null;
    public AI_TARGET_DISTANCE = null;
    public AI_NAV_TARGET = null;
    public AI_NAV_WAYPOINTS = [];
    public AI_SEARCHING_TIMER: any = false;

    constructor(gameroom, data, ...args: any[]) {
        super(gameroom, data, args);

        this._navMesh = gameroom.navMesh;
        this._gameroom = gameroom;

        Object.assign(this, data);
        Object.assign(this, dataDB.get("race", this.race));

        this.default_abilities.forEach((element) => {
            this.abilities.push(new AbilitySchema({ key: element, digit: 1 }));
        });

        this.abilitiesCTRL = new abilitiesCTRL(this);

        this.stateMachine = new StateMachine(this);
        this.stateMachine.add("PATROL", new PatrolState());
        //this.stateMachine.changeTo("PATROL");
    }

    // runs on every server iteration
    update() {
        // if does not have a target, keep monitoring the closest player
        if (this.AI_TARGET === null || this.AI_TARGET === undefined) {
            console.log("SEARCHING FOR CLOSEST PLAYER", this.AI_CLOSEST_PLAYER_DISTANCE);
            this.findClosestPlayer();
        }

        // if entity has a target, monitor it's position
        if (this.AI_TARGET != null && this.AI_TARGET !== undefined) {
            console.log("MONITORING TARGET POSITION", this.AI_TARGET.x, this.AI_TARGET.z);
            this.monitorTarget();
        }

        //
        this.stateMachine.update();
    }

    /*
    //
    patrolling() {
        // if there is a closest player, and in aggro range
        if (this.AI_CLOSEST_PLAYER != null && this.AI_CLOSEST_PLAYER_DISTANCE < Config.MONSTER_ATTACK_DISTANCE) {
            console.log("FOUND CLOSEST PLAYER");
            this.AI_TARGET = this.AI_CLOSEST_PLAYER;

            // reset closest player to null and
            this.AI_CLOSEST_PLAYER = null;
            this.AI_CLOSEST_PLAYER_DISTANCE = null;
        }

        // if entity has a target, start searching for it
        if (this.AI_TARGET && this.AI_TARGET.sessionId) {
            console.log("START CHASING", this.AI_TARGET.sessionId);
            this.brain.setState(this.searching, this);
        }

        // if entity does not have a destination, find one
        if (!this.AI_NAV_TARGET) {
            this.setRandomDestination(this.getPosition());
        }

        // else just continue patrolling
        console.log("AI IS PATROLLING", this.AI_CLOSEST_PLAYER);
        this.moveTowards();
    }

    //
    searching() {
        if (this.AI_SEARCHING_TIMER === false) {
            this.AI_SEARCHING_TIMER = 0;
        }

        // iterate searching timer
        this.AI_SEARCHING_TIMER += 1;

        // if entity is close enough to player, start attacking it
        if (this.AI_TARGET_DISTANCE < Config.MONSTER_ATTACK_DISTANCE) {
            //this.AI_SEARCHING_TIMER = false;
            //this.brain.setState(this.attacking);
        }

        // if entity has been searching for over 50 server iterations, go back to patrolling
        if (this.AI_SEARCHING_TIMER > 50) {
            //this.resetDestination();
            //this.brain.setState(this.patrolling);
        }

        // else keep moving towards target
        this.moveTowards();
    }

    //
    attacking() {
        // if target is escaping, go back to searching
        if (this.AI_TARGET_DISTANCE > Config.MONSTER_ATTACK_DISTANCE) {
            //this.brain.setState(this.searching);
        }

        /*
        // entity animation set to attack
        this.anim_state = EntityState.ATTACK;

        //
        this.AI_ATTACK_INTERVAL += 100;
        if (this.AI_ATTACK_INTERVAL === this.AI_ATTACK_INTERVAL_RATE) {
            let damage = this.calculateDamage(this, this.AI_CURRENT_TARGET);
            this.AI_ATTACK_INTERVAL = 0;
            this.AI_CURRENT_TARGET.health -= damage;
            this.AI_CURRENT_TARGET.normalizeStats();
        }

        if (this.AI_TARGET.isEntityDead()) {
            this.patrolling()
        }
    }

    //
    fleeing() {}
    */

    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////

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

    moveTowards() {
        this.anim_state = EntityState.WALKING;
        // move entity
        if (this.AI_NAV_WAYPOINTS.length > 0) {
            let currentPos = this.getPosition();
            // get next waypoint
            let destinationOnPath = this.AI_NAV_WAYPOINTS[0];
            destinationOnPath.y = 0;

            // calculate next position towards destination
            let updatedPos = this.moveTo(currentPos, destinationOnPath, this.speed);
            this.setPosition(updatedPos);

            // calculate rotation
            this.rot = this.rotateTowards(currentPos, updatedPos);

            // check if arrived at waypoint
            if (destinationOnPath.equals(updatedPos)) {
                this.AI_NAV_WAYPOINTS.shift();
            }
        } else {
            // something is wrong, let's look for a new destination
            this.resetDestination();
        }
    }

    resetDestination(): void {
        this.AI_TARGET = false;
        this.AI_NAV_TARGET = false;
        this.AI_NAV_WAYPOINTS = [];
        this.AI_SEARCHING_TIMER = false;
    }

    /**
     * entity must always know the closest player at all times
     */
    findClosestPlayer() {
        let closestDistance = 1000000;
        this._gameroom.state.players.forEach((entity) => {
            if (this.type === "entity" && entity.type === "player" && !entity.gracePeriod) {
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
        if (this.AI_TARGET !== null && this.AI_TARGET !== undefined && this.AI_TARGET.sessionId) {
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
        let currentPos = new Vector3(this.x, this.y, this.z);
        this.AI_NAV_TARGET = this._gameroom.navMesh.getClosestRegion(targetPos);
        this.AI_NAV_WAYPOINTS = this._gameroom.navMesh.findPath(currentPos, targetPos);
        if (this.AI_NAV_WAYPOINTS.length === 0) {
            this.AI_NAV_TARGET = false;
            this.AI_NAV_WAYPOINTS = [];
        }
    }

    /**
     * Finds a new random valid position on navmesh and sets is as the new destination for this entity
     * @param {Vector3} currentPos
     */
    setRandomDestination(currentPos: Vector3): void {
        this.AI_NAV_TARGET = this._gameroom.navMesh.getRandomRegion();
        this.AI_NAV_WAYPOINTS = this._gameroom.navMesh.findPath(currentPos, this.AI_NAV_TARGET.centroid);
        if (this.AI_NAV_WAYPOINTS.length === 0) {
            this.AI_NAV_TARGET = false;
            this.AI_NAV_WAYPOINTS = [];
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

    /**
     * calculate move velocity based on start and end position
     */
    calculateMoveVelocity(source: Vector3, destination: Vector3) {
        let currentX = source.x;
        let currentZ = source.z;
        let targetX = destination.x;
        let targetZ = destination.z;
        let newPos = new Vector3(0, 0, 0);
        if (targetX < currentX) {
            newPos.x = -1;
        }
        if (targetX > currentX) {
            newPos.x = 1;
        }
        if (targetZ < currentZ) {
            newPos.z = -1;
        }

        if (targetZ > currentZ) {
            newPos.z = 1;
        }
        return newPos;
    }
}
