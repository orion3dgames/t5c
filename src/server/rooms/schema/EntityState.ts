import { Schema, type } from "@colyseus/schema";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { NavMesh } from "../../../shared/yuka";
import { Races } from "../../../shared/Entities/Common/Races";

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

    public isMoving: boolean = false;
    public isDead: boolean = false;

    constructor(gameroom, data, ...args: any[]) {
        super(args);
        this._navMesh = gameroom.navMesh;
        this._gameroom = gameroom;
        Object.assign(this, data);
        Object.assign(this, Races.get(this.race));
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
}
