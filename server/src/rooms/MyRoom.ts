import { Room, Client, updateLobby } from "@colyseus/core";
import { MyRoomState, Player, Cube } from "./schema/MyRoomState";
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

        // generate world
        this.initializeWorld();

        //
        // This is just a demonstration
        // on how to call `updateLobby` from your Room
        //
        this.clock.setTimeout(() => {

            this.setMetadata({
            customData: "Hello world!"
            }).then(() => updateLobby(this));
    
        }, 5000);
        
    }

    onJoin(client: Client, options: any) {

        logger.silly(`*** On Join - ${client.sessionId} ***`);

        // create Player instance
        const player = new Player().assign({
            id: client.id,
            timestamp: this.state.serverTime,
            username: Math.random().toString().substring(10,15)
        });

        // place at initial position
        player.xPos = Math.floor(Math.random() * 11);
        player.yPos = 1;
        player.zPos = Math.floor(Math.random() * 11);

        // place player in the map of players by its sessionId
        // (client.sessionId is unique per connection!)
        this.state.players.set(client.sessionId, player);

        console.log(player.toJSON());
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

        this.onMessage("updatePosition", (client, data) => {
            console.log("update received -> ");
            console.debug(JSON.stringify(data));
            const player = this.state.players.get(client.sessionId);
            player.xPos = data["x"];
            player.yPos = data['y'];
            player.zPos = data["z"];
        });

        this.onMessage("entityUpdate", (client, entityUpdateArray) => {
            logger.silly(`Received entityUpdate from ${client.id}`);
            this.onEntityUpdate(client.id, entityUpdateArray);
        });

    }

    spawnCube(cubeData: any){
        const cube = new Cube(cubeData).assign(cubeData);
        this.state.cubes.set('UNIQUE ID HERE', cube);
        return cube;
    }

    initializeWorld() {

        console.log('initializeWorldFromDB');

        /////////////////////////////////////////////////////////
        // GENERATE MAIN WORLD
        var grid_x = 5;
        var grid_z = 5;
        for (var x = -grid_x; x <= grid_x; x++) {
            for (var z = -grid_z; z <= grid_z; z++) {
                let cubeData = {
                    player_uid: 'SERVER',
                    x: x,
                    y: -1,
                    z: z,
                    color: '#EEEEEE',
                    type: 'crate'
                }
                this.spawnCube(cubeData);

                // ADD A BORDER TO THE MAIN WORLD
                cubeData.y = 0;
                if (z === -grid_x) { this.spawnCube(cubeData); }
                if (x === -grid_z) { this.spawnCube(cubeData); }
                if (x === grid_x) { this.spawnCube(cubeData); }
                if (z === grid_z) { this.spawnCube(cubeData); }

            }
        }     
        console.log("Generated Main World ( " + (grid_x * grid_z) + " cubes ) ");
    }


}
