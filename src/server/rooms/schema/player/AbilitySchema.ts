import { Schema, type } from "@colyseus/schema";
import { GameData } from "../../../GameData";

export class AbilitySchema extends Schema {
    // networked player specific
    @type("string") public key: string = "";
    constructor(data) {
        super(data);
        Object.assign(this, data);
        Object.assign(this, GameData.get("ability", this.key));
    }
}
