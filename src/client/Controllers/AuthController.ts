import { dataDB } from "../../shared/Data/dataDB";
import { PlayerCharacter } from "../../shared/types";
import { apiUrl } from "../../shared/Utils";
import request from "../../shared/Utils/requests";
import State from "../Screens/Screens";
import { SceneController } from "./Scene";

class AuthController {
    private static instance: AuthController;

    private _currentUser;
    private _currentCharacter;
    private _currentLocationKey;
    private _currentLocation;

    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    private constructor() {}

    /**
     * The static method that controls the access to the singleton instance.
     *
     * This implementation let you subclass the Singleton class while keeping
     * just one instance of each subclass around.
     */
    public static getInstance(): AuthController {
        if (!AuthController.instance) {
            AuthController.instance = new AuthController();
        }
        return AuthController.instance;
    }

    public get currentUser() {
        return this._currentUser;
    }

    public get currentLocation() {
        return this._currentLocation;
    }

    public get currentCharacter() {
        return this._currentCharacter;
    }

    // check login details
    public async forceLogin() {
        // get random user
        let req = await request("get", apiUrl() + "/returnRandomUser");
        let character = JSON.parse(req.data).user;
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
            console.log(character);
        }
    }

    // check login details
    public async loggedIn() {
        let user = this.currentUser;

        // check user exists else send back to login
        let req = await request("post", apiUrl() + "/check", {
            token: user.token,
        });

        // check req status
        if (req.status === 200) {
            return JSON.parse(req.data).user;
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
        let req = await request("get", apiUrl() + "/login", {
            username: username,
            password: password,
        });

        // check req status
        if (req.status === 200) {
            // user was found or created
            this._currentUser = JSON.parse(req.data).user;

            // save token to local storage
            localStorage.setItem("t5c_token", JSON.parse(req.data).user.token);

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
    public setCharacter(character: PlayerCharacter) {
        this._currentCharacter = character;
        this._currentLocationKey = character.location;
        this._currentLocation = dataDB.get("location", character.location);
    }

    // set location
    public setLocation(location) {
        this._currentLocationKey = location;
        this._currentLocation = dataDB.get("location", location);
    }

    // logout
    public logout() {
        this._currentUser = null;
        this._currentCharacter = null;
        this._currentLocationKey = null;
        this._currentLocation = null;
        SceneController.goToScene(State.LOGIN);
    }
}

export { AuthController };
