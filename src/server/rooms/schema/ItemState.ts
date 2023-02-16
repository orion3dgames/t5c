import { Schema, type } from "@colyseus/schema";

export class ItemSchema extends Schema {
    // networked player specific
    @type("number") public key: string = "";
    @type("number") public label: string = "";
    @type("number") public description: string = "";

    constructor() {}
}
