import { Schema, type } from "@colyseus/schema";
import { GameData } from "../../../GameData";

export class InventorySchema extends Schema {
    // networked player specific
    @type("string") public key: string = "";
    @type("int16") public qty: number = 0;
    @type("string") public i: string = "0";

    public equippable;
    public class;

    constructor(data) {
        super(data);
        if (data && data.key) {
            Object.assign(this, data);
            Object.assign(this, GameData.get("item", this.key));
        }
    }
}
