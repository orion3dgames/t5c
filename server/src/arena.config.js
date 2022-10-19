"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const arena_1 = require("@colyseus/arena");
const monitor_1 = require("@colyseus/monitor");
const MyRoom_1 = require("./rooms/MyRoom");
const core_1 = require("@colyseus/core");
exports.default = arena_1.default({
    getId: () => "BabylonJS and Colyseus Demo Server",
    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('lobby', core_1.LobbyRoom);
        // Expose your game room with realtime listing enabled.
        gameServer.define("my_room", MyRoom_1.MyRoom).enableRealtimeListing();
    },
    initializeExpress: (app) => {
        app.get("/", (req, res) => {
            res.send("Server ready!");
        });
        /**
         * Bind @colyseus/monitor
         * It is recommended to protect this route with a password.
         * Read more: https://docs.colyseus.io/tools/monitor/
         */
        app.use("/colyseus", monitor_1.monitor());
    },
    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
//# sourceMappingURL=arena.config.js.map