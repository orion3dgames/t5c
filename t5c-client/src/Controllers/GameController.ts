import State from "../Screens/Screens";
import axios from "axios";
import { apiUrl } from "../Utils";

export class GameController {
    private _app;

    // all user data
    public currentRoomID: string;
    public currentSessionID: string;
    public currentLocation;
    public _currentUser;
    public _currentCharacter;
    public selectedEntity;
    public locale: "en";
    public currentMs: number;
    public camY: number;

    // all preloaded assets

    // all game data
    private _gameData = {
        items: [],
        abilities: [],
        locations: [],
        races: [],
    };

    constructor(app) {
        this._app = app;
    }

    /////////////////////////////////////////
    //////////// SCENE MANAGEMENT ///////////
    /////////////////////////////////////////

    public setScene(newState: State) {
        this._app.nextScene = newState;
    }

    /////////////////////////////////////////
    //////////// GAME DATA /////////////////
    /////////////////////////////////////////

    async initializeGameData() {
        const result = await axios.request({
            method: "GET",
            url: "http://localhost:3000/load_game_data",
        });
        this._gameData = result.data.data;
    }

    public getGamgeData(type, key) {
        let returnData;
        switch (type) {
            case "ability":
                returnData = this._gameData.abilities[key] ?? false;
                break;
            case "race":
                returnData = this._gameData.races[key] ?? false;
                break;
            case "location":
                returnData = this._gameData.locations[key] ?? false;
                break;
            case "item":
                returnData = this._gameData.items[key] ?? false;
                break;
            case "":
                returnData = false;
                break;
        }
        return returnData;
    }

    public loadGameData(type) {
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
            case "":
                returnData = false;
                break;
        }

        return returnData;
    }

    /////////////////////////////////////////
    //////////// AUTH DATA /////////////////
    /////////////////////////////////////////

    public get currentUser() {
        return this._currentUser;
    }

    public get currentCharacter() {
        return this._currentCharacter;
    }

    // check login details
    public async forceLogin() {
        const req = await axios.request({
            method: "POST",
            url: apiUrl() + "/returnRandomUser",
        });
        let character = req.data.user;
        if (character) {
            // set user
            this.setUser({
                id: character.user_id,
                username: character.username,
                password: character.password,
                token: character.token,
            });
            //set character
            this.setCharacter(character);
        }
    }

    public isLoggedIn() {
        return this._currentUser ? true : false;
    }

    // check login details
    public async isValidLogin() {
        let user = this.currentUser;

        // check user exists else send back to login
        const req = await axios.request({
            method: "POST",
            params: { token: user.token },
            url: apiUrl() + "/check",
        });

        // check req status
        if (req.status === 200) {
            let user = req.data.user;
            this.setUser(user);
            return user;
        } else {
            // something went wrong
            console.error("Something went wrong.");
        }
    }

    // login as this character
    public async login(username, password) {
        // make sure both the username and password is entered.
        if (!username || !password) {
            console.error("Please enter both the username and the password.");
            return false;
        }

        // send login data
        const req = await axios.request({
            method: "POST",
            params: {
                username: username,
                password: password,
            },
            url: apiUrl() + "/login",
        });

        // check req status
        if (req.status === 200) {
            // user was found or created
            this._currentUser = req.data.user;

            // save token to local storage
            localStorage.setItem("t5c_token", req.data.user.token);

            // go to character selection page
            return true;
        } else {
            // something went wrong
            console.error("Something went wrong.");
            return false;
        }
    }

    // set user
    public setUser(user) {
        this._currentUser = user;
    }

    // set character
    public setCharacter(character) {
        this._currentCharacter = character;
    }

    // logout
    public logout() {
        this._currentUser = null;
        this._currentCharacter = null;
        this.setScene(State.LOGIN);
    }
}
