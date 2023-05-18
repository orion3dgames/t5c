import { Schema, type } from "@colyseus/schema";

export class InventorySchema extends Schema {
    // networked player specific
    @type("string") public key: string = "";
    @type("int16") public qty: number = 0;
    constructor(data) {
        super(data);
        Object.assign(this, data);
    }
}
