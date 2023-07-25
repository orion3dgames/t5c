import { type } from "@colyseus/schema";
import { Entity } from "./Entity";

export class LootSchema extends Entity {
    // networked player specific
    @type("number") public x: number = 0;
    @type("number") public y: number = 0;
    @type("number") public z: number = 0;
    @type("number") public rot: number = 0;
    @type("string") public key: string = "";
    @type("int16") public quantity: number = 0;
}
