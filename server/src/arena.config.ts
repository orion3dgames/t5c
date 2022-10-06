import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";

import { MyRoom } from "./rooms/MyRoom";

export default Arena({
    getId: () => "BabylonJS and Colyseus Demo Server",

    initializeGameServer: (gameServer) => {
        gameServer.define('my_room', MyRoom);
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
