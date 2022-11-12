import { Schema, type } from "@colyseus/schema";

export class CubeSchema extends Schema {
    @type("string") id: string = "ID";
    @type("string") player_uid: string = "SERVER";
    @type("string") color: string = "#EEEEEE";
    @type("string") type: string = "crate";
    @type("number") createdAt: number = Date.now();
    @type("number") x: number = 0.0;
    @type("number") y: number = 0.0;
    @type("number") z: number = 0.0;
  } 
  