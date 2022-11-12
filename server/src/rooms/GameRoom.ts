import { Room, Client, updateLobby } from "@colyseus/core";
import { PlayerDirectionSchema, PlayerKeySchema, PlayerPositionSchema } from './schema/PlayerSchema';
import { CubeSchema } from './schema/CubeSchema';
import { ChatSchema } from './schema/ChatSchema';
import logger = require("../helpers/logger");

import {StateHandlerSchema} from './schema/StateHandlerSchema';

export class GameRoom extends Room<StateHandlerSchema> {

    public maxClients = 64;

    onCreate(options: any) {

        console.log("GameRoom created!", options);

        // Set initial state
        this.setState(new StateHandlerSchema());

        // Set the frequency of the patch rate
        this.setPatchRate(16);

        // Set the Simulation Interval callback
        this.setSimulationInterval(dt => {
            this.state.serverTime += dt;
        });

        // generate world
        //this.initializeWorld();

        this.broadcast("playerMessage", this.generateMessage("Server", "Hello World"));
        
    }

    onJoin(client: Client, options: any) {

        // 
        this.broadcast("playerMessage", this.generateMessage("Server", "Player "+client.sessionId+" has joined the game.") );
        
        this.onMessage("key", (message) => {
            this.broadcast("key", message);
            console.log(message);
        });

        console.log(`player ${client.sessionId} joined room ${this.roomId}.`);
        this.state.addPlayer(client.sessionId);
        
        //Update player
        this.onMessage("playerPosition", (client, data: PlayerPositionSchema) => {
            console.log("playerPosition", data);
            this.state.setPosition(client.sessionId, data);
        });

        this.onMessage("playerDirection", (client, data: PlayerDirectionSchema) => {
            this.state.setDirection(client.sessionId, data);
        });

        this.onMessage("playerKey", (client, data: PlayerKeySchema) => {
            this.state.setKeys(client.sessionId, data);
        });

        this.onMessage("playerMessage", (client, message) => {
            this.broadcast("playerMessage", this.generateMessage(client.sessionId, message));
        });
    }

    // When a client leaves the room
    onLeave(client: Client) {
        if(this.state.players.has(client.sessionId)){
            this.broadcast("playerMessage", "Player "+client.sessionId+" has left the game.");
            this.state.removePlayer(client.sessionId);
        }
    }

    // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
     onDispose() {
        console.log("Dispose GameRoom");
    }


    /////////////////////////////////////////////////

    generateMessage(sessionId: string, message = "") {
        this.state.players.get(sessionId);
        let msg = new ChatSchema;
        msg.senderID = sessionId;
        msg.message = message;
        return msg;
    }

    /*
    spawnCube(cubeData: any){
        const cube = new CubeSchema(cubeData).assign(cubeData);
        this.state.cubes.set(cubeData.id, cube);
        return cube;
    }

    initializeWorld() {

        logger.silly(`*** GENERATE WORLD ***`);

        /////////////////////////////////////////////////////////
        // GENERATE MAIN WORLD
        var grid_x = 20;
        var grid_z = 20;
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
    */


}
