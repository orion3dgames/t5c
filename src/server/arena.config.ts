/*
import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import { WebSocketTransport } from '@colyseus/ws-transport';

import { MyRoom } from "./rooms/GameRoom";
import { LobbyRoom } from "@colyseus/core";

export default Arena({
    getId: () => "BabylonJS and Colyseus Demo Server",

    initializeTransport: function () {
		return new WebSocketTransport({
		
		});
	},

    initializeGameServer: (gameServer) => {
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

        app.use("/colyseus", monitor());
    },

    beforeListen: () => {

    }
});
*/