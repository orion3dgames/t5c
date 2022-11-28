import State from "../client/Screens/Screens"

let Config = {

    // basic server settings
    serverUrlLocal: "ws://localhost:3000",
    //serverUrlProduction: "ws://localhost:3000",
    serverUrlProduction: "wss://t5c.onrender.com",
    maxClients: 64, // set maximum clients per room
    updateRate: 100, // Set frequency the patched state should be sent to all clients, in milliseconds
    logLevel: "info", 

    // basic locations
    initialLocation: "town",
    secondaryLocation: "island",
    locations: {
        "town": {
            title: "Town",
            key: 'town',
            mesh: "town.glb",
            spawnPoint: {
                x: -45.80,
                y: 0,
                z: -1.64
            },
        },
        "island": {
            title: "Island",
            key: 'island',
            mesh: "island.glb",
            spawnPoint: {
                x: 20,
                y: 0,
                z: -23
            },
        },
    },

    // player defaults
    PLAYER_SPEED: 0.50,

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

    goToScene(newState: State, user:any = {}){
        global.T5C.nextScene = newState;
        if(user){
            global.T5C.currentUser = user;
        }
    }

}

export default Config