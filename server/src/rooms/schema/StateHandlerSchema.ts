import {Schema, type, MapSchema} from '@colyseus/schema';

import {PlayerDirectionSchema, PlayerKeySchema, PlayerPositionSchema, PlayerSchema} from './PlayerSchema';
import {ChatSchema} from './ChatSchema';

export class StateHandlerSchema extends Schema {

    @type({map: PlayerSchema})
    players = new MapSchema<PlayerSchema>();
    @type("number") serverTime: number = 0.0;

    addPlayer(sessionId: string) {
        this.players.set(sessionId, new PlayerSchema().assign({sessionId: sessionId}));
    }

    getPlayer(sessionId: string): PlayerSchema {
        return this.players.get(sessionId);
    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    setDirection(sessionId: string, direction: PlayerDirectionSchema) {
        this.getPlayer(sessionId).playerDirection.rotationY = direction.rotationY;
    }

    setKeys(sessionId: string, keys: PlayerKeySchema) {
        const player = this.getPlayer(sessionId);
        player.playerKey.up = keys.up;
        player.playerKey.right = keys.right;
        player.playerKey.down = keys.down;
        player.playerKey.left = keys.left;
        player.playerKey.jump = keys.jump;
    }

    setPosition(sessionId: string, position: PlayerPositionSchema) {
        const player = this.getPlayer(sessionId);
        player.playerPosition.x = position.x;
        player.playerPosition.y = position.y;
        player.playerPosition.z = position.z;
    }

}