import { Schema, type } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("number") id: number = 0;
  @type('string') public sessionId: string;
  @type("string") public name: string = "";
  @type("number") public sequence: number = 0; // input sequence
  @type('number') public x: number;
  @type('number') public y: number;
  @type('number') public z: number;
  @type('number') public rot: number;
  @type('number') public health: number;
  @type('number') public level: number;
  @type('number') public experience: number;
  @type("string") public location: string = "";
}
