import { Schema, type } from "@colyseus/schema";
import { EntityState } from "../../../shared/Entities/Entity/EntityState";
import { AI_STATE } from "../../../shared/Entities/Entity/AIState";
import { dataDB } from "../../../shared/Data/dataDB";
import { AbilitySchema } from "./AbilitySchema";

export class EnemySchema extends Schema {
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

    public default_abilities;
    public abilities: AbilitySchema[] = [];

    constructor(data) {
        super();

        // assign default values for entity
        Object.assign(this, data);
        Object.assign(this, dataDB.get("race", this.race));

        this.default_abilities.forEach((element) => {
            this.abilities.push(new AbilitySchema({ key: element, digit: 1 }));
        });
    }

    public update() {
        return this;
    }
}
