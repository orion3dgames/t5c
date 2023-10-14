import axios from "axios";

import { Ability, Race, Item, Quest } from "../../../shared/types";

export class gameDataCTRL {
    private _gameData = {
        items: [],
        abilities: [],
        locations: [],
        races: [],
        quests: [],
    };

    constructor() {}

    async initialize() {
        const options = {
            method: "GET",
            url: "http://localhost:3000/load_game_data",
            params: { category: "all", count: "2" },
            headers: {
                "X-RapidAPI-Key": "your-rapid-key",
                "X-RapidAPI-Host": "famous-quotes4.p.rapidapi.com",
            },
        };
        const result = await axios.request(options);
        this._gameData = result.data.data;
    }

    public get(type, key) {
        let returnData;
        switch (type) {
            case "ability":
                returnData = (this._gameData.abilities[key] as Ability) ?? false;
                break;
            case "race":
                returnData = (this._gameData.races[key] as Race) ?? false;
                break;
            case "location":
                returnData = this._gameData.locations[key] ?? false;
                break;
            case "item":
                returnData = (this._gameData.items[key] as Item) ?? false;
                break;
            case "quest":
                returnData = (this._gameData.quests[key] as Quest) ?? false;
                break;
            case "":
                returnData = false;
                break;
        }
        return returnData;
    }

    public load(type) {
        let returnData;
        switch (type) {
            case "abilities":
                returnData = this._gameData.abilities ?? false;
                break;
            case "races":
                returnData = this._gameData.races ?? false;
                break;
            case "locations":
                returnData = this._gameData.locations ?? false;
                break;
            case "items":
                returnData = this._gameData.items ?? false;
                break;
            case "quests":
                returnData = this._gameData.quests ?? false;
                break;
            case "":
                returnData = false;
                break;
        }

        return returnData;
    }
}
