import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import { WebSocketTransport } from '@colyseus/ws-transport';

import { MyRoom } from "./rooms/MyRoom";
import { LobbyRoom } from "@colyseus/core";

export default Arena({
    getId: () => "BabylonJS and Colyseus Demo Server",

    initializeTransport: function () {
		return new WebSocketTransport({
			/* ...options */
		});
	},

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('lobby', LobbyRoom);

        // Expose your game room with realtime listing enabled.
        gameServer.define("my_room", MyRoom).enableRealtimeListing();

        // Make sure to never call the `simulateLatency()` method in production.
        if (process.env.NODE_ENV !== "production") {
            gameServer.simulateLatency(200);
        }
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
        app.use("/colyseus", monitor());
    },

    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
