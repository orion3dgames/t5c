import { Schema, type } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("string") id: string = "ID";
  @type('string') public sessionId: string;
  @type("number") timestamp: number = 0.0;
  @type("string") username: string = "";
  @type('number') public x: number;
  @type('number') public y: number;
  @type('number') public z: number;
  @type('number') public rot: number;
}

