import { Command } from "@colyseus/command";
import { GameRoom } from "../../GameRoom";
import Logger from "../../../../shared/Logger";
import { PlayerState } from "../../schema/PlayerState";
import { EntityCurrentState } from "../../../../shared/Entities/Entity/EntityCurrentState";

class OnPlayerJoinCommand extends Command<
    GameRoom,
    {
        sessionId: string;
    }
> {
    execute({ sessionId, client }) {
        this.payload;
        // prepare player data
        let data = client.auth;
        let player = {
            id: data.id,
            sessionId: sessionId,
            type: "player",
            race: "player_hobbit",
            name: data.name,
            location: data.location,
            x: data.x,
            y: data.y,
            z: data.z,
            rot: data.rot,
            state: EntityCurrentState.IDLE,

            health: data.health,
            mana: data.mana,
            maxHealth: data.health,
            maxMana: data.mana,

            level: data.level,
            experience: data.experience,
            gold: data.gold,

            strength: 15,
            endurance: 16,
            agility: 15,
            intelligence: 20,
            wisdom: 20,

            abilities: data.abilities,
            inventory: data.inventory,
        };
        this.state.players.set(sessionId, new PlayerState(this.room, player));

        // set player as online
        //database.toggleOnlineStatus(client.auth.id, 1);

        // log
        //Logger.info(`[gameroom][onJoin] player ${client.sessionId} joined room ${client.roomId}.`, player);
    }
}

export { OnPlayerJoinCommand };
