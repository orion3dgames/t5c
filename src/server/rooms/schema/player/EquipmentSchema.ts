import { Schema, type } from "@colyseus/schema";
import { dataDB } from "../../../../shared/Data/dataDB";
import { PlayerSlots } from "../../../../shared/Data/ItemDB";

export class EquipmentSchema extends Schema {
    // networked player specific
    @type("string") public key: string = "";
    @type("int16") public slot: PlayerSlots;
    constructor(data) {
        super(data);
        Object.assign(this, dataDB.get("item", this.key));
        Object.assign(this, data);
    }
}
