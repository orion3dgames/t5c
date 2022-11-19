import {Schema, type, MapSchema} from '@colyseus/schema';
import {PlayerSchema} from './PlayerSchema';

import Config from '../../../shared/Config';

export class StateHandlerSchema extends Schema {

    @type({map: PlayerSchema})
    players = new MapSchema<PlayerSchema>();
    @type("number") serverTime: number = 0.0;

    addPlayer(sessionId: string) {
        let defaultSpawnPoint = Config.locations[Config.initialLocation].spawnPoint;
        this.players.set(sessionId, new PlayerSchema().assign({
            sessionId: sessionId,
            username: sessionId,
            x: defaultSpawnPoint.x,
            y: 0,
            z: defaultSpawnPoint.z,
            rot: 0,
            location: defaultSpawnPoint.key,
        }));
    }

    getPlayer(sessionId: string): PlayerSchema {
        return this.players.get(sessionId);
    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    setPosition(sessionId: string, x: number, y: number, z: number, rotation: number) {
        const player = this.getPlayer(sessionId);
        player.x = x;
        player.y = y;
        player.z = z;
        player.rot = rotation;
    }

    calculatePosition(sessionId: string, h: number, v: number, seq: number) {
        const player = this.getPlayer(sessionId);
        player.x -= h;
        player.y = 0;
        player.z -= v;
        player.rot = Math.atan2(h, v);
        player.sequence = seq;
    }

    setLocation(sessionId, location){
        const player = this.getPlayer(sessionId);
        player.location = location;
    }

    generateRandomUUID(){
        return Math.random().toString().substring(10,20);
    }

}