import {Schema, type, MapSchema} from '@colyseus/schema';
import { Vector3 } from 'babylonjs';

import {PlayerDirectionSchema, PlayerKeySchema, PlayerPositionSchema, PlayerSchema} from './PlayerSchema';

export class StateHandlerSchema extends Schema {

    @type({map: PlayerSchema})
    players = new MapSchema<PlayerSchema>();
    @type("number") serverTime: number = 0.0;

    addPlayer(sessionId: string) {

        let min = -10;
        let max = 10;
        let defaultPosition = new PlayerPositionSchema({
            x: Math.floor(Math.random() * (max - min + 1)) + min,
            y: 0,
            z: Math.floor(Math.random() * (max - min + 1)) + min,
        });

        console.log(defaultPosition);

        this.players.set(sessionId, new PlayerSchema().assign({
            sessionId: sessionId, 
            playerPosition: defaultPosition,
            playerDirection: new PlayerDirectionSchema({x:0,y:0,z:0}),
            username: sessionId
        }));
    }

    getPlayer(sessionId: string): PlayerSchema {
        return this.players.get(sessionId);
    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    setDirection(sessionId: string, direction: PlayerDirectionSchema) {
        this.getPlayer(sessionId).playerDirection.y = direction.y;
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

    generateRandomUUID(){
        return Math.random().toString().substring(10,20);
    }

}