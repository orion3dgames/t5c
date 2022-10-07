import { Schema, type } from "@colyseus/schema"

export class Position extends Schema {
    @type("number") x: number;
    @type("number") y: number;
    @type("number") z: number;
}