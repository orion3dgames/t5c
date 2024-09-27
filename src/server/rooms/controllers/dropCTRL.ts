import Logger from "../../utils/Logger";
import { Leveling } from "../../../shared/Class/Leveling";
import { randomNumberInRange } from "../../../shared/Utils";
import { GetLoot } from "../../../shared/Class/LootTable";
import { nanoid } from "nanoid";
import { LootSchema } from "../schema/LootSchema";
import { PlayerSchema } from "../schema";
import { ServerMsg } from "../../../shared/types";

export class dropCTRL {
    private _owner: PlayerSchema;
    private _client;

    constructor(owner, client) {
        this._owner = owner;
        this._client = client;
    }

    public addExperience(target) {
        // calculate experience total
        let exp = target.experienceGain;
        if (target.AI_SPAWN_INFO && target.AI_SPAWN_INFO.experienceGain) {
            exp = target.AI_SPAWN_INFO.experienceGain;
        }
        let amount = Math.floor(randomNumberInRange(exp.min, exp.max));
        Leveling.addExperience(this._owner, amount);
        console.log("[addExperience]", amount);
    }

    public addGold(target) {
        let goldGains = target.goldGain;
        if (target.AI_SPAWN_INFO && target.AI_SPAWN_INFO.goldGain) {
            goldGains = target.AI_SPAWN_INFO.goldGain;
        }
        if (goldGains.min && goldGains.max) {
            let gold = Math.floor(randomNumberInRange(goldGains.min, goldGains.max));
            this._owner.player_data.gold += gold;

            Logger.info(`[gameroom][addGold] player has gained ${gold} gold, total: ${this._owner.player_data.gold}`);

            // inform player
            this._client.send(ServerMsg.SERVER_MESSAGE, {
                type: "event",
                message: "You pick up " + gold + " worth of gold.",
                date: new Date(),
            });
        }
    }

    public dropItems(target) {
        let items = target.AI_SPAWN_INFO.drops ?? [];
        let loot = GetLoot(items);
        loot.forEach((drop) => {
            // drop item on the ground
            let sessionId = nanoid(10);
            let currentPosition = target.getPosition();
            currentPosition.x += randomNumberInRange(-2, 2);
            currentPosition.z += randomNumberInRange(-2, 2);
            let data = {
                key: drop.id,
                name: "Apple",
                sessionId: sessionId,
                x: currentPosition.x,
                y: 0.25,
                z: currentPosition.z,
                qty: drop.quantity,
            };
            let entity = new LootSchema(this._owner._state, data);
            this._owner._state.entities.set(sessionId, entity);
        });
    }
}
