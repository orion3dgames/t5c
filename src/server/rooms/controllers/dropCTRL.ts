import Logger from "../../../shared/Logger";
import { Leveling } from "../../../shared/Entities/Player/Leveling";
import { randomNumberInRange } from "../../../shared/Utils";
import { GetLoot } from "../../../shared/Entities/Player/LootTable";
import { nanoid } from "nanoid";
import { LootSchema } from "../schema/LootSchema";

export class dropCTRL {
    private _owner;
    private _client;

    constructor(owner, client) {
        this._owner = owner;
        this._client = client;
    }

    public addExperience(target) {
        // calculate experience total
        let exp = target.experienceGain;
        let amount = Math.floor(randomNumberInRange(exp.min, exp.max));

        // does player level up?
        let doesLevelUp = false;
        if (Leveling.doesPlayerlevelUp(this._owner.level, this._owner.player_data.experience, amount)) {
            doesLevelUp = true;
        }

        // add experience to player
        this._owner.player_data.experience += amount;
        this._owner.level = Leveling.convertXpToLevel(this._owner.player_data.experience);
        Logger.info(`[gameroom][addExperience] player has gained ${amount} experience`);

        if (doesLevelUp) {
            Logger.info(`[gameroom][addExperience] player has gained a level and is now level ${this._owner.level}`);
            this._owner.maxMana = this._owner.maxMana + 50;
            this._owner.maxHealth = this._owner.maxHealth + 50;
            this._owner.health = this._owner.maxHealth;
            this._owner.mana = this._owner.maxMana;
            this._owner.player_data.points += 5;

            // inform player
            this._client.send("notification", {
                type: "event",
                message: "You've gained knowledge and are now level " + this._owner.level + ".",
                date: new Date(),
            });
        }
    }

    public addGold(target) {
        let goldGains = target.goldGain;
        if (goldGains.min && goldGains.max) {
            let gold = Math.floor(randomNumberInRange(goldGains.min, goldGains.max));
            this._owner.player_data.gold += gold;

            Logger.info(`[gameroom][addGold] player has gained ${gold} gold, total: ${this._owner.player_data.gold}`);

            // inform player
            this._client.send("notification", {
                type: "event",
                message: "You pick up " + gold + " worth of gold.",
                date: new Date(),
            });
        }
    }

    public dropItems(target) {
        let loot = GetLoot(target.drops);
        loot.forEach((drop) => {
            console.log(drop);
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
                quantity: drop.quantity,
            };
            let entity = new LootSchema(this, data);
            this._owner._gameroom.state.items.set(sessionId, entity);
        });
    }
}
