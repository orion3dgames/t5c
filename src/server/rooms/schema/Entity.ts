import { Schema, type } from "@colyseus/schema";

export class Entity extends Schema {
    /////////////////////////////////////////////////////////////
    // the below will be synced to all the players
    @type("string") public sessionId: string;

    constructor(...args: any[]) {
        super();
    }
}
