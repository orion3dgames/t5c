import { apiUrl, request } from "../../../shared/Utils";
import { dataDB } from "../../../shared/Data/dataDB";

export class gameDataCTRL {
    private _gameData = {
        items: [],
        abilities: [],
        locations: [],
        races: [],
    };

    constructor() {}

    async initialize() {
        // get random user
        let req = await request("get", "/load_game_data");
        console.log(JSON.parse(req.data));
    }

    get all() {
        return this._gameData;
    }
}
