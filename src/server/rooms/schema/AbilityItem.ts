import { Schema, type } from "@colyseus/schema";
import { dataDB } from "../../../shared/Data/dataDB";

export class AbilityItem extends Schema {
    // networked player specific
    @type("number") public id: number;
    @type("string") public key: string = "";
    @type("uint8") public digit: string = "";
    constructor(data) {
        super(data);
        Object.assign(this, data);
        Object.assign(this, dataDB.get("ability", this.key));
    }
}
