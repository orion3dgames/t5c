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

        if (data.type === "ability") {
            Object.assign(this, GameData.get("ability", data.key));
        }
        if (data.type === "item") {
            Object.assign(this, GameData.get("item", data.key));
        }
        Object.assign(this, data);
    }
}
