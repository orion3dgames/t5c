import { Schema, type } from "@colyseus/schema";
import { GameData } from "../../../GameData";
import { ItemClass } from "../../../../shared/types";

export class HotbarSchema extends Schema {
    // networked player specific
    @type("string") public type: string = "";
    @type("string") public key: string = "";
    @type("uint8") public digit: string = "";

    public class?: ItemClass.CONSUMABLE;

    constructor(data) {
        super(data);
        Object.assign(this, data);
        if (this.type === "ability") {
            Object.assign(this, GameData.get("ability", this.key));
        }
        if (this.type === "item") {
            Object.assign(this, GameData.get("item", this.key));
        }
    }
}
