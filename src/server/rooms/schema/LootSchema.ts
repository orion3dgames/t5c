import { Schema, type } from "@colyseus/schema";
import { Vector3 } from "../../../shared/yuka";

export class LootSchema extends Schema {
    // networked player specific
    @type("string") public key: string = "";
    @type("string") public sessionId: string;
    @type("int16") public x: number = 0;
    @type("int16") public y: number = 0;
    @type("int16") public z: number = 0;
    @type("int16") public rot: number = 0;
    @type("int16") public quantity: number = 0;

    public label;
    public description;

    constructor(gameroom, data) {
        super(gameroom, data);
        Object.assign(this, data);
    }

    getPosition() {
        return new Vector3(this.x, this.y, this.z);
    }
}
