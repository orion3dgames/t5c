import { Schema, type } from "@colyseus/schema";
import { EntityState } from "../../../shared/Entities/Entity/EntityState";
import { AI_STATE } from "../../../shared/Entities/Entity/AIState";
import { NavMesh, Vector3 } from "../../../shared/yuka";
import { dataDB } from "../../../shared/Data/dataDB";
import { abilitiesCTRL } from "../controllers/abilityCTRL";
import { AbilitySchema } from "./AbilitySchema";

import FSM from "../brain/fsm";
import Config from "../../../shared/Config";

export class BrainSchema1 extends Schema {
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
    @type("string") public type: string = "";
    @type("string") public race: string = "";

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

    public brain: FSM;
    public velocity: Vector3 = new Vector3();

    public AI_STATE;
    public AI_CLOSEST_PLAYER: any = null;
    public AI_CLOSEST_PLAYER_DISTANCE: any = null;
    public AI_VELOCITY;
    public AI_TARGET: any = null;
    public AI_TARGET_DISTANCE: any = null;
    public AI_NAV_TARGET: any = null;
    public AI_NAV_WAYPOINTS: Vector3[] = [];
    public AI_SEARCHING_TIMER: any = false;

    public AI_ATTACK_INTERVAL: number = 0;
    public AI_ATTACK_INTERVAL_RATE: number = 1000;

    public AI_DEAD_INTERVAL: number = 0;
    public AI_DEAD_INTERVAL_RATE: number = 5000;

    public AI_SPAWN_INFO;

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

        // initialize the brain
        this.brain = new FSM();

        // default brain state
        this.brain.setState(this.decision, this);
    }

    // runs on every server iteration
    update() {
        // if does not have a target, keep monitoring the closest player
        if (this.AI_TARGET === null || this.AI_TARGET === undefined) {
            //console.log('FIND CLOSEST PLAYER');
            this.findClosestPlayer();
        }

        // if entity has a target, monitor it's position
        if (this.AI_TARGET != null && this.AI_TARGET !== undefined) {
            this.monitorTarget();
        }

        // Update the FSM controlling the "brain". It will invoke the currently active state function
        this.brain.update();
    }

    // initial state, will process AI_SPAWN_INFO,
    /*
    {
        type: "global",
        behaviour: "patrol",
        aggressive: 1,
        description: "will randomly patrol along the navmesh",
        points: [],
        radius: 0,
        amount: 1,
        race: "male_enemy",
    },
    */
    decision() {
        let info = this.AI_SPAWN_INFO;
        if (info.behaviour === "patrol") {
            this.brain.setState(this.patrolling, this);
        }
    }

    //
    patrolling() {
        this.anim_state = EntityState.WALKING;
        this.AI_CURRENT_STATE = AI_STATE.WANDER;

        // if there is a closest player, and in aggro range
        if (this.AI_CLOSEST_PLAYER_DISTANCE != null && this.AI_CLOSEST_PLAYER_DISTANCE < Config.MONSTER_AGGRO_DISTANCE) {
            //console.log("FOUND CLOSEST PLAYER", this.AI_CLOSEST_PLAYER_DISTANCE, Config.MONSTER_AGGRO_DISTANCE);
            this.AI_TARGET = this.AI_CLOSEST_PLAYER;

            // reset closest player to null and
            this.AI_CLOSEST_PLAYER = null;
            this.AI_CLOSEST_PLAYER_DISTANCE = null;
        }

        // if entity has a target, start searching for it
        if (this.AI_TARGET && this.AI_TARGET.sessionId) {
            //console.log("START CHASING", this.AI_TARGET.sessionId);
            this.AI_NAV_WAYPOINTS = [];
            this.brain.setState(this.searching, this);
        }

        // if entity does not have a destination, find one
        if (!this.AI_NAV_TARGET) {
            this.setRandomDestination(this.getPosition());
        }

        // else just continue patrolling
        console.log(this.name + " IS PATROLLING IN", this._gameroom.metadata.location, this.AI_CLOSEST_PLAYER_DISTANCE);
        this.moveTowards();
    }

    //
    searching() {
        //console.log(this.name + " is searching for target", this._gameroom.metadata.location, this.AI_TARGET.isEntityDead(), this.AI_TARGET.name);

        this.AI_CURRENT_STATE = AI_STATE.SEEKING;

        if (this.AI_TARGET === null || this.AI_TARGET === undefined || this.AI_TARGET === false || this.AI_TARGET.isEntityDead()) {
            this.cancelTarget();
            this.brain.setState(this.patrolling, this);
            return false;
        }

        // start timer
        if (this.AI_SEARCHING_TIMER === false) {
            this.AI_SEARCHING_TIMER = 0;
        }

        // iterate searching timer
        this.AI_SEARCHING_TIMER += 100;

        // if entity is close enough to player, start attacking it
        if (this.AI_TARGET_DISTANCE < Config.MONSTER_ATTACK_DISTANCE) {
            this.AI_SEARCHING_TIMER = false;
            this.brain.setState(this.attacking, this);
        }

        // if player come back into range, reset timer
        if (this.AI_TARGET_DISTANCE < Config.MONSTER_AGGRO_DISTANCE) {
            this.AI_SEARCHING_TIMER = 0;
        }

        // if entity has been searching for over 50 server iterations, go back to patrolling
        if (this.AI_SEARCHING_TIMER > Config.MONSTER_SEARCHING_PERIOD) {
            this.resetDestination();
            this.AI_TARGET = null;
            this.brain.setState(this.patrolling, this);
            return false;
        }

        // if target has moved
        if (this.AI_NAV_WAYPOINTS.length < 1 && this.AI_TARGET !== null) {
            this.setTargetDestination(this.AI_TARGET.getPosition());
        }

        if (this.AI_TARGET !== null) {
            // else keep moving towards target
            //console.log(this.name+" has found a target and is heading towards it", this.AI_TARGET.sessionId);
            this.moveTowards("seek");
        }
    }

    //
    attacking() {
        //console.log(this.name + " is attacking target", this._gameroom.metadata.location, this.AI_TARGET.isEntityDead(), this.AI_TARGET.name);

        if (this.AI_TARGET === null || this.AI_TARGET === undefined || this.AI_TARGET === false || this.AI_TARGET.isEntityDead() === true) {
            this.cancelTarget();
            this.brain.setState(this.patrolling, this);
            return false;
        }

        // set state and anim state
        this.anim_state = EntityState.ATTACK;
        this.AI_CURRENT_STATE = AI_STATE.ATTACKING;

        // if target is escaping, go back to searching
        if (this.AI_TARGET_DISTANCE > Config.MONSTER_ATTACK_DISTANCE) {
            this.AI_NAV_WAYPOINTS = [];
            this.brain.setState(this.searching, this);
        }

        // attack target loop
        this.AI_ATTACK_INTERVAL += 100;
        if (this.AI_ATTACK_INTERVAL === this.AI_ATTACK_INTERVAL_RATE) {
            let damage = this.calculateDamage(this, this.AI_TARGET);
            this.AI_ATTACK_INTERVAL = 0;
            this.AI_TARGET.health -= damage;
            this.AI_TARGET.normalizeStats();
        }
    }

    dead() {
        if (this.isDead === false) {
            this.health = 0;
            this.blocked = true;
            this.anim_state = EntityState.DEAD;
            this.AI_CURRENT_STATE = AI_STATE.IDLE;
            this.AI_TARGET = null;
            this.isDead = true;
        }

        this.AI_DEAD_INTERVAL += 100;

        // delete so entity can be respawned
        if (this.AI_DEAD_INTERVAL === this.AI_DEAD_INTERVAL_RATE) {
            this._gameroom.state.entities.delete(this.sessionId);
        }
    }

    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////

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

    setTarget(target) {
        this.AI_TARGET = target;
    }

    isEntityDead() {
        return this.health <= 0;
    }

    setAsDead() {
        this.brain.setState(this.dead, this);
    }

    calculateDamage(owner, target) {
        return 10;
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

    moveTowards(type: string = "seek") {
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
        this.AI_NAV_TARGET = null;
        this.AI_NAV_WAYPOINTS = [];
        this.AI_SEARCHING_TIMER = false;
    }

    cancelTarget() {
        this.AI_SEARCHING_TIMER = false;
        this.AI_NAV_WAYPOINTS = [];
        this.AI_TARGET = null;
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
            this.AI_NAV_TARGET = null;
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
