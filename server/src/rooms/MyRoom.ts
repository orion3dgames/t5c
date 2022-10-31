import { Room, Client, updateLobby } from "@colyseus/core";
import { MyRoomState, Player, Cube, ChatMessage } from "./schema/MyRoomState";
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
        this.setPatchRate(16);

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
            //username: this.generateRandomUUID() 
            username: client.sessionId
        });

        // place at initial position
        player.xPos = Math.floor(Math.random() * 11);
        player.yPos = 0;
        player.zPos = Math.floor(Math.random() * 11);

        // place player in the map of players by its sessionId
        // (client.sessionId is unique per connection!)
        this.state.players.set(client.sessionId, player);

    }

    generateRandomUUID(){
        return Math.random().toString().substring(10,20);
    }

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);
        console.log(client.sessionId, "left!");
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }

    registerForMessages() {

        // move event
        this.onMessage("updatePosition", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            console.log("update received from client "+client.sessionId+" -> ", JSON.stringify(player), JSON.stringify(data));
            player.xPos = data["x"];
            player.yPos = data['y'];
            player.zPos = data["z"];
        });

        // message
        this.onMessage("message", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            console.log("received message from "+client.sessionId+" -> ", message);
            let msg = new ChatMessage;
            msg.senderID = client.sessionId;
            msg.message = message;
            this.broadcast("message", msg);
        });

    }

    spawnCube(cubeData: any){
        const cube = new Cube(cubeData).assign(cubeData);
        this.state.cubes.set(cubeData.id, cube);
        return cube;
    }

    initializeWorld() {

        logger.silly(`*** GENERATE WORLD ***`);

        /////////////////////////////////////////////////////////
        // GENERATE MAIN WORLD
        var grid_x = 10;
        var grid_z = 10;
        for (var x = -grid_x; x <= grid_x; x++) {
            for (var z = -grid_z; z <= grid_z; z++) {
                let cubeData = {
                    id: this.generateRandomUUID(),
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

        console.log("Generated Main World with " + (grid_x * grid_z) + " cubes ");
    }


}
