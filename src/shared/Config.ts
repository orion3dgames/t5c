import State from "../client/Screens/Screens"
import Locations from "./Data/Locations";
import { isLocal } from "./Utils";

let Config = {
    
    // general settings
    title: "T5C",
    version: "Version 0.2.1",
    lang: 'en',

    // server settings
    serverUrlLocal: "ws://localhost:3000",
    apiUrlLocal: "http://localhost:3000",
    serverUrlProduction: "wss://t5c.onrender.com",
    apiUrlProduction: "https://t5c.onrender.com",
    maxClients: 20, // set maximum clients per room
    updateRate: 100, // Set frequency the patched state should be sent to all clients, in milliseconds 
    databaseUpdateRate: 1000, // the frequency at which server save players position
    logLevel: "info",

    // database settings
    databaseLocation: './database.db',

    // game settings
    PLAYER_NAMEPLATE_TIMEOUT: 15000, // 15 seconds
    PLAYER_VIEW_DISTANCE: 25,
    MONSTER_RESPAWN_RATE: 10000,
    MONSTER_AGGRO_DISTANCE: 5,
    MONSTER_ATTACK_DISTANCE: 2,

    // UI SETTINGS
    UI_CENTER_PANEL_WIDTH: .6,
    UI_CENTER_PANEL_BG: "rgba(0,0,0,.5)",

    // players settings
    PLAYER_SPEED: 0.55,
    PLAYER_START_HEALTH: 100,
    PLAYER_START_LEVEL: 1,

    // basic locations
    initialLocation: "lh_town",

    // functions
    setDefault(){
        global.T5C = {
            nextScene: isLocal() ? State.GAME : State.LOGIN,
            //nextScene: State.LOGIN,
            currentRoomID: "",
            currentSessionID: "",
            currentLocation: Locations[Config.initialLocation],
            currentUser: false,
            currentMs: 0
        }
    },

    goToScene(newState: State){
        global.T5C.nextScene = newState;
    }

}

export default Config