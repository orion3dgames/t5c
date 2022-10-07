import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";

import logger = require("../helpers/logger");

export class MyRoom extends Room<MyRoomState> {

    onCreate(options: any) {

        this.setState(new MyRoomState());

        logger.info("*********************** MMO ROOM CREATED ***********************");
        console.log(options);
        logger.info("***********************");

        if (options["roomId"] != null) {
            this.roomId = options["roomId"];
        }

        this.maxClients = 10;

        // Set initial state
        this.setState(new MyRoomState());

        // Register message handlers for messages from the client
        this.registerForMessages();

        // Set the frequency of the patch rate
        this.setPatchRate(50);

        // Set the Simulation Interval callback
        this.setSimulationInterval(dt => {
            this.state.serverTime += dt;
        });
        
    }

    onJoin(client: Client, options: any) {

        logger.silly(`*** On Join - ${client.sessionId} ***`);

        // create Player instance
        const player = new Player().assign({
            id: client.id,
            timestamp: this.state.serverTime,
            username: btoa(Math.random().toString()).substring(10,15)
        });

        // place at initial position
        player.xPos = 0;
        player.yPos = 0;
        player.zPos = 0;

        // place player in the map of players by its sessionId
        // (client.sessionId is unique per connection!)
        this.state.players.set(client.sessionId, player);

        logger.silly(player.toJSON());
    }

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);
        console.log(client.sessionId, "left!");
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }


    /**
     * Callback for the "entityUpdate" message from the client to update an entity
     * @param {*} clientID The sessionId of the client we want to update
     * @param {*} data The data containing the data we want to update the newtworkedUser with
     */
    onEntityUpdate(clientID: string, data: any) {

        // Assumes that index 0 is going to be the sessionId of the user
        if (this.state.players.has(`${data[0]}`) === false) {
            logger.info(`Attempted to update client with id ${data[0]} but room state has no record of it`)
            return;
        }

        let stateToUpdate = this.state.players.get(data[0]);

        let startIndex = 1;

        for (let i = startIndex; i < data.length; i += 2) {
            const property = data[i];
            let updateValue = data[i + 1];
            if (updateValue === "inc") {
                updateValue = data[i + 2];
                i++; // inc i once more since we had a inc;
            }

            (stateToUpdate as any)[property] = updateValue;
        }

        stateToUpdate.timestamp = parseFloat(this.state.serverTime.toString());
    }

    registerForMessages() {

        this.onMessage("entityUpdate", (client, entityUpdateArray) => {
            logger.silly(`Received entityUpdate from ${client.id}`);
            this.onEntityUpdate(client.id, entityUpdateArray);
        });

    }
}
