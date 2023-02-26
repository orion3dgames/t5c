import { AbilitiesDB } from "./AbilitiesDB";
import { RacesDB } from "./RacesDB";
import { LocationsDB } from "./LocationsDB";
import { ItemsDB } from "./ItemDB";

export class dataDB {
    public static get(type, key) {
        let returnData;
        switch (type) {
            case "ability":
                returnData = AbilitiesDB[key] ?? false;
                break;
            case "race":
                returnData = RacesDB[key] ?? false;
                break;
            case "location":
                returnData = LocationsDB[key] ?? false;
                break;
            case "item":
                returnData = ItemsDB[key] ?? false;
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
            case "item":
                returnData = ItemsDB ?? false;
            case "":
                returnData = false;
                break;
        }
        return returnData;
    }
}
