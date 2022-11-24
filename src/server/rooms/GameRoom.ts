import http from "http";
import { Room, Client } from "@colyseus/core";
import logger = require("../helpers/logger");

import {StateHandlerSchema} from './schema/StateHandlerSchema';
import Config from '../../shared/Config';

export class GameRoom extends Room<StateHandlerSchema> {

    public maxClients = 64;
    public autoDispose = false;

    onCreate(options: any) {

        console.log("GameRoom created!", this.roomId, options);
 
        this.setMetadata(options);

        // Set initial state
        this.setState(new StateHandlerSchema());
 
        // Set the frequency of the patch rate
        // let's make it the same as our game loop
        this.setPatchRate(Config.updateRate);

        // Set the simulation interval callback
        this.setSimulationInterval(dt => {
            this.state.serverTime += dt; 
        });  

        // set max clients
        this.maxClients = Config.maxClients; 

        // initialize database
 
    }

    // Authorize client based on provided options before WebSocket handshake is complete
    onAuth (client: Client, options: any, request: http.IncomingMessage) { 

        console.log(client.sessionId, options, request.headers);
        return true;
        /**
         * Alternatively, you can use `async` / `await`,
         * which will return a `Promise` under the hood.
         */
        /*
        const userData = await validateToken(options.accessToken);
        if (userData) {
            return userData;

        } else {
            throw new ServerError(400, "bad access token");
        }*/
    }

    onJoin(client: Client, options: any) {

        // add player to server
        console.log(`player ${client.sessionId} joined room ${this.roomId}.`, this.metadata, options);
        this.state.addPlayer(client.sessionId);

        // set zone location and spawn point
        this.state.setSpawnPoint(client.sessionId, this.metadata.location); 
        this.state.setLocation(client.sessionId, this.metadata.location); 
        this.state.setUsername(client.sessionId, options.username); 

        // on player input event
        this.onMessage("playerInput", (client, data: any) => {
            this.state.calculatePosition(client.sessionId, data.h, data.v, data.seq);
        });

        // on player teleport
        this.onMessage("playerTeleport", (client, location) => {
            console.log('playerTeleport', location);
            this.state.setLocation(client.sessionId, location);
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
    /////////////////////////////////////////////////

    

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
