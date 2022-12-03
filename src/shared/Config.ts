import { nanoid } from "nanoid";
import State from "../client/Screens/Screens"

let Config = {
    
    // general settings
    title: "T5C",
    version: "Version 0.1.9",

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
    
    // players settings
    PLAYER_SPEED: 0.50,

    // basic locations
    initialLocation: "lh_town",
    locations: {
        "lh_town": {
            title: "Town",
            key: 'lh_town',
            mesh: "lh_town.glb",
            spawnPoint: {
                x: 7.50,
                y: 0,
                z: -14.27,
                rot: -180
            },
        },
        "lh_dungeon_01": {
            title: "Dungeon Level 1",
            key: 'lh_dungeon_01',
            mesh: "lh_dungeon_01.glb",
            spawnPoint: {
                x: 11.33,
                y: 0,
                z: -2.51,
                rot: -180
            },
        },
    },


    // functions
    setDefault(){
        global.T5C = {
            nextScene: State.LOGIN,
            currentRoomID: "",
            currentSessionID: "",
            currentLocation: Config.locations[Config.initialLocation],
            currentUser: false,
            currentMs: 0
        }
    },

    checkForSceneChange(){
        let currentScene = global.T5C.nextScene;
        if(global.T5C.nextScene != State.NULL){
            global.T5C.nextScene = State.NULL;
            return currentScene;  
        }
    },

    goToScene(newState: State){
        global.T5C.nextScene = newState;
    }

}

export default Config