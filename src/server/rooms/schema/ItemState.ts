import { Schema, type } from "@colyseus/schema";

export class ChatSchema extends Schema {
    // networked player specific
    @type("number") public value: number = 0;

    constructor() {}
}
