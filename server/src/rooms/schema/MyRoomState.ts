import { MapSchema, Schema, type } from "@colyseus/schema";

export class Player extends Schema {

  // Player ID
  @type("string") id: string = "ID";

  //Position
  @type("number") xPos: number = 0.0;
  @type("number") yPos: number = 0.0;
  @type("number") zPos: number = 0.0;

  //Rotation
  @type("number") xRot: number = 0.0;
  @type("number") yRot: number = 0.0;
  @type("number") zRot: number = 0.0;

  //Interpolation values
  @type("number") timestamp: number = 0.0;
  @type("string") username: string = "";
  
}

//Chat related schemas
export class Cube extends Schema {
  @type("string") id: string = "ID";
  @type("string") player_uid: string = "SERVER";
  @type("string") color: string = "#EEEEEE";
  @type("string") type: string = "crate";
  @type("number") createdAt: number = Date.now();
  @type("number") x: number = 0.0;
  @type("number") y: number = 0.0;
  @type("number") z: number = 0.0;
}

//
export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Cube }) cubes = new MapSchema<Cube>();
  @type("number") serverTime: number = 0.0;
}

//Chat related schemas
export class ChatMessage extends Schema {
  @type("string") senderID: string = "";
  @type("string") message: string = "";
  @type("number") timestamp: number = 0.0;
  @type("number") createdAt: number = Date.now();
}