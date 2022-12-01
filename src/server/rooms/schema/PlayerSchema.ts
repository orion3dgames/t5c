import { Schema, type } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("number") id: number = 0;
  @type('string') public sessionId: string;
  @type("number") timestamp: number = 0.0;
  @type("string") public username: string = "";
  @type("number") public sequence: number = 0;
  @type('number') public x: number;
  @type('number') public y: number;
  @type('number') public z: number;
  @type('number') public rot: number;
  @type("string") public location: string = "";
  @type("number") createdAt: number = Date.now();
}

