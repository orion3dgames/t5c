import { Schema, type } from "@colyseus/schema";
import { Vector3 } from "../../../shared/yuka";

import { Entity } from "./Entity";

export class LootSchema extends Entity {
    // networked player specific
    @type("number") public x: number = 0;
    @type("number") public y: number = 0;
    @type("number") public z: number = 0;
    @type("number") public rot: number = 0;
    @type("string") public key: string = "";
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
