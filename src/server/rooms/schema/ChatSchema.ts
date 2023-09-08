import { Schema, type } from "@colyseus/schema";

//Chat related schemas
export class ChatSchema extends Schema {
  @type("string") senderID: string = "";
  @type("string") name: string = "";
  @type("string") message: string = "";
  @type("number") timestamp: number = 0.0;
  @type("number") createdAt: number = Date.now();
}