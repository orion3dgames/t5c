import { RacesDB, Race } from "../../Data/RacesDB";

class Races {
    public static get(key) {
        return RacesDB[key];
    }
}

export { Races, Race };
