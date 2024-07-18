import http from "http";
import { Room, Client, Delayed } from "@colyseus/core";
import { GameRoomState } from "./state/GameRoomState";
import loadNavMeshFromFile from "../utils/loadNavMeshFromFile";
import Logger from "../utils/Logger";
import { NavMesh } from "../../shared/Libs/yuka-min";
import { Auth } from "./commands";
import { PlayerSchema } from "./schema";
import { Database } from "../Database";
import { Config } from "../../shared/Config";

export class GameRoom extends Room<GameRoomState> {
    public maxClients = 64;
    public database: any;
    public delayedInterval!: Delayed;
    public navMesh: NavMesh;
    public config;

    public disposeTimer;

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // on create room event
    async onCreate(options: any) {
        Logger.info("[gameroom][onCreate] game room created: " + this.roomId, options);

        this.setMetadata(options);

        this.config = new Config();

        // initialize navmesh
        const navMesh = await loadNavMeshFromFile(options.location);
        this.navMesh = navMesh;
        Logger.info("[gameroom][onCreate] navmesh " + options.location + " initialized.");

        // Set initial state
        this.setState(new GameRoomState(this, this.navMesh, options));

        // Register message handlers for messages from the client
        this.registerMessageHandlers();

        //Set frequency the patched state should be sent to all clients
        this.setPatchRate(this.config.updateRate);

        //Set a simulation interval that can change the state of the game
        this.setSimulationInterval((dt) => {
            this.state.update(dt);
        }, this.config.updateRate);

        // set max clients
        this.maxClients = this.config.maxClients;
        this.autoDispose = true;

        // initialize database
        this.database = new Database(this.config);
        await this.database.init();

        ///////////////////////////////////////////////////////////////////////////
        // if players are in a room, make sure we save any changes to the database.
        // only save if there is any players
        this.delayedInterval = this.clock.setInterval(() => {
            if (this.state.entities && this.state.entities.size > 0) {
                this.state.entityCTRL.all.forEach((entity) => {
                    if (entity instanceof PlayerSchema) {
                        entity.save(this.database);
                    }
                });
            }
        }, this.config.databaseUpdateRate);
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // authorize client based on provided options before WebSocket handshake is complete
    async onAuth(client: Client, authData: any, request: http.IncomingMessage) {
        let character = await Auth.check(this.database, authData);
        console.log("[onAuth]", authData);
        return character;
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // on client join
    async onJoin(client: Client, options: any) {
        this.state.addPlayer(client);
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // client message handler

    private registerMessageHandlers() {
        /////////////////////////////////////
        // on player input
        this.onMessage("*", (client, type, data) => {
            this.state.processMessage(client, type, data);
        });
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // when a client leaves the room
    async onLeave(client: Client, consented: boolean) {
        // remove from state
        this.state.deleteEntity(client.sessionId);

        // make sure no one has this entity as a target
        this.state.removeTarget(client.sessionId);

        // colyseus client leave
        client.leave();

        // set character as not online
        this.database.toggleOnlineStatus(client.auth.id, 0);

        // log
        Logger.info(`[onLeave] player ${client.auth.name} left`);
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
    onDispose() {
        // probably should save some information to database here that could be restored on creation

        //
        Logger.warning(`[onDispose] game room removed. `);
    }
}
