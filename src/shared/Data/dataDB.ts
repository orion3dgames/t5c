import { AbilitiesDB, Ability } from "./AbilitiesDB";
import { Race, RacesDB } from "./RacesDB";
import { LocationsDB } from "./LocationsDB";
import { Item, ItemsDB } from "./ItemDB";

export class dataDB {
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
                returnData = (LocationsDB[key] as Location) ?? false;
                break;
            case "item":
                returnData = (ItemsDB[key] as Item) ?? false;
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
            case "":
                returnData = false;
                break;
        }

        return returnData;
    }
}
