import State from "../client/Screens/Screens";

class Config {
    // general settings
    title = "T5C";
    version = "Version 0.4.0";
    lang = "en";

    // server settings
    port = 3000;
    maxClients = 20; // set maximum clients per room
    updateRate = 200; // Set frequency the patched state should be sent to all clients, in milliseconds
    databaseUpdateRate = 10000; // the frequency at which server save data to the database, in milliseconds
    logLevel = "info";

    // database settings
    databaseLocation = "./database.db";

    // game settings
    PLAYER_NAMEPLATE_TIMEOUT = 15000; // 15 seconds
    PLAYER_VIEW_DISTANCE = 22;
    PLAYER_LOSE_FOCUS_DISTANCE = 30;
    PLAYER_GRACE_PERIOD = 0;
    PLAYER_INTERACTABLE_DISTANCE = 5;
    PLAYER_INVENTORY_SPACE = 23;
    PLAYER_HOTBAR_SIZE = 9;

    // enemies settings
    MONSTER_RESPAWN_RATE = 20000;
    MONSTER_CHASE_PERIOD = 2000;
    MONSTER_AGGRO_DISTANCE = 5;
    MONSTER_ATTACK_DISTANCE = 2;

    // ui theme settings
    UI_CENTER_PANEL_WIDTH = 0.6;
    UI_CENTER_PANEL_BG = "rgba(0,0,0,.5)";
    UI_SIDEBAR_WIDTH = "320px;";

    // default location
    initialLocation = "lh_town";
}

export { Config };
