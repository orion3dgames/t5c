import { Schema, type } from "@colyseus/schema";
import { dataDB } from "../../../../shared/Data/dataDB";

export class AbilitySchema extends Schema {
    // networked player specific
    @type("string") public key: string = "";
    @type("uint8") public digit: string = "";
    constructor(data) {
        super(data);
        Object.assign(this, data);
        Object.assign(this, dataDB.get("ability", this.key));
    }
}
