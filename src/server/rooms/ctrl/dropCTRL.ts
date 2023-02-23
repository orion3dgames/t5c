import Logger from "../../../shared/Logger";

import { AbilitiesDB } from "../../../shared/Data/AbilitiesDB";
import { Ability } from "../../../shared/Entities/Common/Ability";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { Leveling } from "../../../shared/Entities/Player/Leveling";
import { nanoid } from "nanoid";
import { ItemState } from "../schema/ItemState";
import { randomNumberInRange } from "../../../shared/Utils";

export class dropCTRL {
    private _owner;
    private _client;

    constructor(owner, client) {
        this._owner = owner;
        this._client = client;
    }

    public addExperience(target){

        // calculate experience total
        let amount = target.experienceGain;

        // does player level up?
        let doesLevelUp = false;
        if (Leveling.doesPlayerlevelUp(this._owner.level, this._owner.experience, amount)) {
            doesLevelUp = true;
        }

        // add experience to player
        this._owner.experience += amount;
        this._owner.level = Leveling.convertXpToLevel(this._owner.experience);
        Logger.info(`[gameroom][addExperience] player has gained ${amount} experience`);

        if (doesLevelUp) {
            Logger.info(`[gameroom][addExperience] player has gained a level and is now level ${this._owner.level}`);
            this._owner.maxMana = this._owner.maxMana + 50;
            this._owner.maxHealth = this._owner.maxHealth + 50;
            this._owner.health = this._owner.maxHealth;
            this._owner.mana = this._owner.maxMana;

            // inform player
            this._client.send("notification", {
                type: "event",
                message: "You've gained knowledge and are now level " + this._owner.level + ".",
                date: new Date(),
            });
        }
    }

    public addGold(target){
        let goldGains = target.goldGain;
        if(goldGains.min && goldGains.max){
            let gold = randomNumberInRange(goldGains.min, goldGains.max);
            this._owner.gold += gold;

            Logger.info(`[gameroom][addExperience] player has gained ${gold} gold`);

            // inform player
            this._client.send("notification", {
                type: "event",
                message: "You pick up " + gold + " worth of gold.",
                date: new Date(),
            });
        } 
    }

    public calculateDrops(target){
        
        // any drops?
        let sessionId = nanoid();
        let currentPosition = target.getPosition();
        currentPosition.x += randomNumberInRange(0.1,1.5);
        currentPosition.z += randomNumberInRange(0.1,1.5);
        let data = {
            key: 'apple',
            name: "Apple",
            sessionId: sessionId, 
            x: currentPosition.x,
            y: 0.25,
            z: currentPosition.z,
        }
        let entity = new ItemState(this, data);
        this._owner._gameroom.state.items.set(sessionId, entity);

    }


}
