import State from "../client/Screens/Screens";

let Config = {
    // general settings
    title: "T5C",
    version: "Version 0.2.3",
    lang: "en",

    // server settings
    port: 3000,
    maxClients: 20, // set maximum clients per room
    updateRate: 100, // Set frequency the patched state should be sent to all clients, in milliseconds
    databaseUpdateRate: 10000, // the frequency at which server save players position
    logLevel: "info",

    // database settings
    databaseLocation: "./database.db",

    // game settings
    PLAYER_NAMEPLATE_TIMEOUT: 15000, // 15 seconds
    PLAYER_VIEW_DISTANCE: 50,
    PLAYER_LOSE_FOCUS_DISTANCE: 22,
    PLAYER_GRACE_PERIOD: 0,

    MONSTER_RESPAWN_RATE: 20000,
    MONSTER_CHASE_PERIOD: 2000,
    MONSTER_AGGRO_DISTANCE: 5,
    MONSTER_ATTACK_DISTANCE: 2,

    // UI SETTINGS
    UI_CENTER_PANEL_WIDTH: 0.6,
    UI_CENTER_PANEL_BG: "rgba(0,0,0,.5)",

    // basic locations
    initialLocation: "lh_town",

    // default scene
    //defaultScene: isLocal() ? State.GAME : State.LOGIN,
    defaultScene: State.LOGIN,
};

export default Config;
