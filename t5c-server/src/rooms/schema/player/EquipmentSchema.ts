import { Schema, type } from "@colyseus/schema";
import { GameData } from "../../../GameData";

export class EquipmentSchema extends Schema {
    // networked player specific
    @type("string") public key: string = "";
    @type("int16") public slot: number;
    constructor(data) {
        super(data);
        Object.assign(this, GameData.get("item", this.key));
        Object.assign(this, data);
    }
}
