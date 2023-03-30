import { Schema, type } from "@colyseus/schema";
import Logger from "../../../shared/Logger";
import Config from "../../../shared/Config";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { AI_STATE } from "../../../shared/Entities/Entity/AIState";
import { Vector3, NavMesh } from "../../../shared/yuka";
import { dataDB } from "../../../shared/Data/dataDB";

export class EnemyState extends Schema {
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
    @type("int8") public anim_state: EntityCurrentState = EntityCurrentState.IDLE;
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

    // public vars
    public currentRegion;
    public wanderRegion;
    public targetRegion;
    public destinationPath;

    public AI_CURRENT_TARGET_POSITION = null;
    public AI_CURRENT_TARGET_DISTANCE = 0;
    public AI_CURRENT_TARGET;
    public AI_CURRENT_TARGET_FOUND = false;
    public AI_CURRENT_ABILITY;
    public AI_STATE_REMAINING_DURATION: number = 0;
    public AI_SEEKING_ELAPSED_TIME: number = 0;
    public AI_CLOSEST_TARGET_POSITION = null;
    public AI_CLOSEST_TARGET_DISTANCE: number = 0;
    public AI_CLOSEST_TARGET = null;
    public AI_ATTACK_INTERVAL: number = 0;
    public AI_ATTACK_INTERVAL_RATE: number = 1000;

    constructor(gameroom, data, ...args: any[]) {
        super(gameroom, data, args);

        this._navMesh = gameroom.navMesh;
        this._gameroom = gameroom;
        this.client = this.getClient();

        Object.assign(this, data);
        Object.assign(this, dataDB.get("race", this.race));
    }

    // runs on every server iteration
    update() {
        // RESET VALUES
        this.AI_CURRENT_TARGET_POSITION = null;
        this.AI_CURRENT_TARGET_DISTANCE = 0;
        this.AI_CLOSEST_TARGET_POSITION = null;
        this.AI_CLOSEST_TARGET_DISTANCE = 0;
        this.AI_CLOSEST_TARGET = null;

        // make sure this entity knows where the closest player is
        this.findClosestPlayer();

        // if entity has a target, monitor it's position
        this.monitorTarget();

        //////////////////////////////////////////////////
        // if not dead
        if (this.isDead === false) {
            // continuously gain mana
            if (this.mana < this.maxMana) {
                this.mana += this.manaRegen;
            }

            // continuously gain health
            if (this.health < this.maxHealth) {
                this.health += this.healthRegen;
            }
        }

        ///////////////////////////////////////////////////
        // AI BRAIN
        if (this.type === "entity") {
            // default behaviour
            this.AI_CURRENT_STATE = AI_STATE.IDLE;

            // if entity has a target,
            if (this.AI_CURRENT_TARGET != null) {
                // start chasing player
                this.AI_CURRENT_STATE = AI_STATE.SEEKING;

                // if entity is close enough to player, start attacking it
                if (this.AI_CURRENT_TARGET_DISTANCE < Config.MONSTER_ATTACK_DISTANCE) {
                    // set ai state to attack
                    this.AI_CURRENT_STATE = AI_STATE.ATTACKING;
                    this.AI_CURRENT_TARGET_FOUND = true;
                } else {
                    // increment seeking timer
                    this.AI_SEEKING_ELAPSED_TIME += 1;
                }

                if (this.AI_CURRENT_TARGET.isDead) {
                    this.returnToWandering();
                }

                // if entity is seeking and target gets away return to wandering
                // - found and attacked player, but player managed to get away
                // - was seeking player for over 50 server iteration but did not manage to catch player
                if ((this.AI_CURRENT_TARGET_FOUND && this.AI_CURRENT_TARGET_DISTANCE > Config.MONSTER_AGGRO_DISTANCE) || this.AI_SEEKING_ELAPSED_TIME > 50) {
                    this.AI_CURRENT_STATE = AI_STATE.WANDER;
                    this.AI_CURRENT_TARGET = null;
                    this.AI_CURRENT_TARGET_DISTANCE = 0;
                    this.AI_CURRENT_TARGET_FOUND = false;
                    this.AI_SEEKING_ELAPSED_TIME = 0;
                    this.resetDestination();
                    this.targetRegion = null;
                }
            }

            // if no target, monitor closest player for range distance
            if (this.AI_CURRENT_TARGET === null) {
                this.AI_CURRENT_STATE = AI_STATE.WANDER;
                if (this.AI_CLOSEST_TARGET && this.AI_CLOSEST_TARGET_DISTANCE < Config.MONSTER_AGGRO_DISTANCE) {
                    this.setTarget(this.AI_CLOSEST_TARGET);
                }
            }

            // if entity is dead
            if (this.health < 0 || this.health === 0 || this.isDead) {
                this.AI_CURRENT_STATE = AI_STATE.IDLE;
            }

            // something is wrong
            if (this.AI_CURRENT_TARGET && !this._gameroom.state.players.get(this.AI_CURRENT_TARGET.sessionId)) {
                this.returnToWandering();
            }
        }
    }

    public getClient() {
        return this._gameroom.clients.get(this.sessionId);
    }

    /**
     * monitor a target
     */
    monitorTarget() {
        if (this.AI_CURRENT_TARGET !== null && this.AI_CURRENT_TARGET !== undefined && this.AI_CURRENT_TARGET.sessionId) {
            let targetPos = this.AI_CURRENT_TARGET.getPosition();
            let entityPos = this.getPosition();
            let distanceBetween = entityPos.distanceTo(targetPos);
            this.AI_CURRENT_TARGET_POSITION = targetPos;
            this.AI_CURRENT_TARGET_DISTANCE = distanceBetween;
        } else {
            // else entity has no target
            this.AI_CURRENT_TARGET = null;
            this.AI_CURRENT_TARGET_POSITION = null;
            this.AI_CURRENT_TARGET_DISTANCE = 0;
        }
    }

    getPosition() {
        return new Vector3(this.x, this.y, this.z);
    }

    // entity must always know the closest player at all times
    // todo: there must be a better way to do this
    findClosestPlayer() {
        let closestDistance = 1000000;
        this._gameroom.state.players.forEach((entity) => {
            if (this.type === "entity" && entity.type === "player" && !entity.gracePeriod) {
                let playerPos = new Vector3(entity.x, entity.y, entity.z);
                let entityPos = new Vector3(this.x, this.y, this.z);
                let distanceBetween = entityPos.distanceTo(playerPos);
                if (distanceBetween < closestDistance) {
                    closestDistance = distanceBetween;
                    this.AI_CLOSEST_TARGET_POSITION = new Vector3(entity.x, entity.y, entity.z);
                    this.AI_CLOSEST_TARGET_DISTANCE = distanceBetween;
                    this.AI_CLOSEST_TARGET = entity;
                }
            }
        });
    }

    isEntityDead() {
        return this.health <= 0;
    }

    returnToWandering() {
        this.AI_CURRENT_TARGET = null;
        this.AI_CURRENT_STATE = AI_STATE.WANDER;
    }

    setAsDead() {
        this.health = 0;
        this.blocked = true;
        this.anim_state = EntityCurrentState.DEAD;
        this.AI_CURRENT_STATE = AI_STATE.IDLE;
        this.AI_CURRENT_TARGET = null;
        this.isDead = true;

        // delete so entity can be respawned
        setTimeout(() => {
            Logger.info(`[gameroom][processAbility] Deleting entity from server`, this.sessionId);
            this._gameroom.state.entities.delete(this.sessionId);
        }, Config.MONSTER_RESPAWN_RATE);
    }

    /**
     * ATTACK BEHAVIOUR
     */
    attack() {
        // entity animation set to attack
        this.anim_state = EntityCurrentState.ATTACK;

        this.AI_ATTACK_INTERVAL += 100;

        if (this.AI_ATTACK_INTERVAL === this.AI_ATTACK_INTERVAL_RATE) {
            let damage = 10;
            this.AI_ATTACK_INTERVAL = 0;
            this.AI_CURRENT_TARGET.health -= damage;
            this.AI_CURRENT_TARGET.normalizeStats();

            /*
            // inform player
            let caster = this._gameroom.clients.get(this.AI_CURRENT_TARGET.sessionId);
            caster.send("notification", {
                type: "event",
                message: this.name + " attacked you, and you lost " + damage + " health.",
                date: new Date(),
            });*/
        }

        if (this.AI_CURRENT_TARGET.health <= 0) {
            this.returnToWandering();
        }
    }

    /**
     * SEEK BEHAVIOUR
     */
    seek() {
        // if entity does not have a destination, find one
        if (!this.targetRegion) {
            this.setDestination(this.AI_CURRENT_TARGET_POSITION);
        }

        // save current position
        let currentPos = this.getPosition();

        // move entity
        if (this.destinationPath.length > 0) {
            // get next waypoint
            let destinationOnPath = this.destinationPath[0];
            destinationOnPath.y = 0;

            // calculate next position towards destination
            let updatedPos = this.moveTo(currentPos, destinationOnPath, this.speed);
            this.setPosition(updatedPos);

            // calculate rotation
            this.rot = this.calculateRotation(currentPos, updatedPos);

            // check if arrived at waypoint
            if (destinationOnPath.equals(updatedPos)) {
                this.destinationPath.shift();
            }
        } else if (this.destinationPath.length === 1) {
            // move straight to player
            let updatedPos = this.moveTo(currentPos, this.AI_CURRENT_TARGET_POSITION, this.speed);
            this.setPosition(updatedPos);
            this.rot = this.calculateRotation(currentPos, updatedPos);
        } else {
            this.resetDestination();
        }
    }

    /**
     * WANDER BEHAVIOUR
     */
    wander() {
        // save current position
        let currentPos = this.getPosition();

        // if entity does not have a destination, find one
        if (!this.wanderRegion) {
            this.setWanderDestination(currentPos);
        }

        // move entity
        if (this.destinationPath.length > 0) {
            // get next waypoint
            let destinationOnPath = this.destinationPath[0];
            destinationOnPath.y = 0;

            // calculate next position towards destination
            let updatedPos = this.moveTo(currentPos, destinationOnPath, this.speed);
            this.setPosition(updatedPos);

            // calculate rotation
            this.rot = this.calculateRotation(currentPos, updatedPos);

            // check if arrived at waypoint
            if (destinationOnPath.equals(updatedPos)) {
                this.destinationPath.shift();
            }
        } else {
            // something is wrong, let's look for a new destination
            this.resetDestination();
        }
    }

    goToDestination() {
        // save current position
        let currentPos = this.getPosition();

        // move entity
        if (this.destinationPath.length > 0) {
            // get next waypoint
            let destinationOnPath = this.destinationPath[0];
            destinationOnPath.y = 0;

            // calculate next position towards destination
            let updatedPos = this.moveTo(currentPos, destinationOnPath, this.speed);
            this.setPosition(updatedPos);

            // calculate rotation
            this.rot = this.calculateRotation(currentPos, updatedPos);

            // check if arrived at waypoint
            if (destinationOnPath.equals(updatedPos)) {
                this.destinationPath.shift();
            }
        } else {
            // something is wrong, let's cancel destination
            this.resetDestination();
        }
    }

    /**
     * Finds a new random valid position on navmesh and sets is as the new destination for this entity
     * @param {Vector3} currentPos
     */
    setWanderDestination(currentPos: Vector3): void {
        this.wanderRegion = this._gameroom.navMesh.getRandomRegion();
        this.destinationPath = this._gameroom.navMesh.findPath(currentPos, this.wanderRegion.centroid);
        if (this.destinationPath.length === 0) {
            this.wanderRegion = false;
            this.destinationPath = false;
        }
    }

    /**
     * Finds a valid position on navmesh matching the supplier targetPos and sets is as the new destination for this entity
     * @param {Vector3} targetPos
     */
    setDestination(targetPos: Vector3): void {
        let currentPos = new Vector3(this.x, this.y, this.z);
        this.targetRegion = this._gameroom.navMesh.getClosestRegion(targetPos);
        this.destinationPath = this._gameroom.navMesh.findPath(currentPos, targetPos);
        if (this.destinationPath.length === 0) {
            this.targetRegion = false;
            this.destinationPath = false;
        }
    }

    resetDestination(): void {
        this.wanderRegion = false;
        this.targetRegion = false;
        this.destinationPath = false;
    }

    calculatePathDistance() {
        if (this.destinationPath.length > 0) {
            this.destinationPath.forEach((element) => {});
        }
        return 0;
    }

    setLocation(location: string): void {
        this.location = location;
    }

    setPosition(updatedPos: Vector3): void {
        this.x = updatedPos.x;
        this.y = updatedPos.y;
        this.z = updatedPos.z;
    }

    setTarget(target) {
        this.AI_CURRENT_TARGET = target;
    }

    /**
     * Check if player can move from sourcePos to newPos
     * @param {Vector3} sourcePos source position
     * @param {Vector3} newPos destination position
     * @returns boolean
     */
    canMoveTo(sourcePos: Vector3, newPos: Vector3): boolean {
        return this._navMesh.checkPath(sourcePos, newPos);
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
