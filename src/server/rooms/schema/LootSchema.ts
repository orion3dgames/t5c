import { type } from "@colyseus/schema";
import { Entity } from "./Entity";
import { dataDB } from "../../../shared/Data/dataDB";
import { Vector3 } from "../../../shared/yuka-min";

export class LootSchema extends Entity {
    // networked player specific
    @type("string") public type: string = "item";
    @type("number") public x: number = 0;
    @type("number") public y: number = 0;
    @type("number") public z: number = 0;
    @type("number") public rot: number = 0;
    @type("string") public key: string = "";
    @type("int16") public quantity: number = 0;

    public name: string = "";
    public description: string = "";

    public _state;

    constructor(state, data, ...args: any[]) {
        super();

        this._state = state;

        // assign data
        Object.assign(this, data);
        Object.assign(this, dataDB.get("item", this.key));
    }

    // entity update
    public update() {}

    getPosition() {
        return new Vector3(this.x, this.y, this.z);
    }
}
