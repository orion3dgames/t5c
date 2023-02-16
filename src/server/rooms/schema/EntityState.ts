import { Schema, type } from "@colyseus/schema";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { NavMesh } from "../../../shared/yuka";
import { Races } from "../../../shared/Entities/Common/Races";
import { Vector3 } from "../../../shared/yuka";
import { PlayerState } from "./PlayerState";

export class EntityState extends Schema {
    // id and name
    @type("number") id: number = 0;
    @type("string") public sessionId: string;
    @type("string") public name: string = "";
    @type("string") public type: string = "player";
    @type("string") public race: string = "player_hobbit";

    // position & rotation
    @type("string") public location: string = "";
    @type("number") public sequence: number = 0; // latest input sequence
    @type("number") public x: number = 0;
    @type("number") public y: number = 0;
    @type("number") public z: number = 0;
    @type("number") public rot: number = 0;

    // player details
    @type("number") public health: number = 0;
    @type("number") public maxHealth: number = 0;
    @type("number") public mana: number = 0;
    @type("number") public maxMana: number = 0;
    @type("number") public level: number = 0;
    @type("number") public experience: number = 0;

    public manaRegen: number = 0;
    public healthRegen: number = 0;
    public speed: number = 0;
    public experienceGain: number = 0;

    // flags
    @type("boolean") public blocked: boolean = false; // if true, used to block player and to prevent movement
    @type("number") public state: EntityCurrentState = EntityCurrentState.IDLE;

    public _navMesh: NavMesh;
    public _gameroom;
    public raceData;
    public client;

    public isMoving: boolean = false;
    public isDead: boolean = false;

    public AI_CURRENT_TARGET_POSITION = null;
    public AI_CURRENT_TARGET_DISTANCE = 0;
    public AI_CURRENT_TARGET;
    public AI_CURRENT_TARGET_FOUND = false;
    public AI_CURRENT_ABILITY;

    constructor(gameroom, data, ...args: any[]) {
        super(args);
        this._navMesh = gameroom.navMesh;
        this._gameroom = gameroom;
        this.client = this.getClient();
        Object.assign(this, data);
        Object.assign(this, Races.get(this.race));
    }

    public getClient() {
        return this._gameroom.clients.get(this.sessionId);
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

    getPosition() {
        return new Vector3(this.x, this.y, this.z);
    }

    setTarget(target) {
        this.AI_CURRENT_TARGET = target;
    }

    hasTarget() {
        return this.AI_CURRENT_TARGET ?? false;
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
