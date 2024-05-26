import { AbilitiesDB } from "./data/AbilitiesDB";
import { RacesDB } from "./data/RacesDB";
import { LocationsDB } from "./data/LocationsDB";
import { ItemsDB } from "./data/ItemDB";
import { QuestsDB } from "./data/QuestsDB";
import { HelpDB } from "./data/HelpDB";

import { Ability, Race, Item, Quest } from "../shared/types";

export class GameData {
    public static get(type, key) {
        let returnData;
        switch (type) {
            case "ability":
                returnData = (AbilitiesDB[key] as Ability) ?? false;
                break;
            case "race":
                returnData = (RacesDB[key] as Race) ?? false;
                break;
            case "location":
                returnData = LocationsDB[key] ?? false;
                break;
            case "item":
                returnData = (ItemsDB[key] as Item) ?? false;
                break;
            case "quest":
                returnData = (QuestsDB[key] as Quest) ?? false;
                break;
            case "":
                returnData = false;
                break;
        }
        return returnData;
    }

    public static load(type) {
        
        let returnData;
        switch (type) {
            case "abilities":
                returnData = AbilitiesDB ?? false;
                break;
            case "races":
                returnData = RacesDB ?? false;
                break;
            case "locations":
                returnData = LocationsDB ?? false;
                break;
            case "items":
                returnData = ItemsDB ?? false;
                break;
            case "quests":
                returnData = QuestsDB ?? false;
                break;
            case "help":
                returnData = HelpDB ?? false;
                break;
            case "":
                returnData = false;
                break;
        }

        return returnData;
    }
}
