import { Schema, type } from "@colyseus/schema";
import { EntityState } from "../../../shared/Entities/Entity/EntityState";
import { AI_STATE } from "../../../shared/Entities/Entity/AIState";
import { NavMesh, Vector3 } from "../../../shared/yuka";
import { dataDB } from "../../../shared/Data/dataDB";
import { abilitiesCTRL } from "../controllers/abilityCTRL";
import { AbilitySchema } from "./AbilitySchema";

import Config from "../../../shared/Config";

export class YukaSchema extends Schema {
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
    }

    // runs on every server iteration
    update() {}
}
