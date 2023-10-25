import { Schema, type } from "@colyseus/schema";
import { GameData } from "../../../GameData";
import { QuestObjective } from "../../../../shared/types";

export class QuestSchema extends Schema {
    // networked player specific
    @type("string") public key: string = "";
    @type("int8") public status: number = 0;
    @type("int16") public qty: number = 0;

    title: string;
    description: string;
    objective: string;
    type: QuestObjective;
    location: string;
    spawn_key: string;
    experienceOnCompletion: number;
    isRepeatable: boolean;

    constructor(data) {
        super(data);
        if (data && data.key) {
            Object.assign(this, data);
            Object.assign(this, GameData.get("quest", this.key));
        }
    }
}
