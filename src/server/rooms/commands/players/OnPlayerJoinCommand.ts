import { Command } from "@colyseus/command";
import { Client } from "@colyseus/core";
import { GameRoom } from "../../GameRoom";
import Logger from "../../../../shared/Logger";
import { PlayerState, PlayerData } from "../../schema/PlayerState";
import { EntityCurrentState } from "../../../../shared/Entities/Entity/EntityCurrentState";

class OnPlayerJoinCommand extends Command<GameRoom, { client: Client }> {
    execute({ client }) {
        // prepare player data
        let data = client.auth;
        let player = {
            id: data.id,

            x: data.x,
            y: data.y,
            z: data.z,
            rot: data.rot,

            health: data.health,
            maxHealth: data.health,
            mana: data.mana,
            maxMana: data.mana,
            level: data.level,

            sessionId: client.sessionId,
            name: data.name,
            type: "player",
            race: "player_hobbit",

            location: data.location,
            sequence: 0,
            blocked: false,
            state: EntityCurrentState.IDLE,

            player_data: new PlayerData({
                gold: data.gold,
                strength: 15,
                endurance: 16,
                agility: 15,
                intelligence: 20,
                wisdom: 20,
                experience: data.experience,
                abilities: data.abilities,
                inventory: data.inventory,
            }),
        };

        this.state.players.set(client.sessionId, new PlayerState(this.room, player));

        // set player as online
        //database.toggleOnlineStatus(client.auth.id, 1);

        /*
        {
                gold: data.gold,
                strength: 15,
                endurance: 16,
                agility: 15,
                intelligence: 20,
                wisdom: 20,
                experience: data.experience,
                abilities: data.abilities,
                inventory: data.inventory,
            } */

        // log
        //Logger.info(`[gameroom][onJoin] player ${client.sessionId} joined room ${client.roomId}.`, player);
    }
}

export { OnPlayerJoinCommand };
