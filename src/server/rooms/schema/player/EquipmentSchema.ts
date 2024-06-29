import { Schema, type } from "@colyseus/schema";
import { GameData } from "../../../GameData";

export class EquipmentSchema extends Schema {
    // networked player specific
    @type("string") public key: string = "";
    @type("int16") public slot: number;
    constructor(data, owner) {
        super(data);
        Object.assign(this, GameData.get("item", this.key));
        Object.assign(this, data);

        // update player stats
        if (owner.statsCTRL) {
            owner.statsCTRL.equipItem(owner._state.gameData.get("item", this.key));
        }
    }
}
