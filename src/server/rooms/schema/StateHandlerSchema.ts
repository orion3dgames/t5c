import {Schema, type, MapSchema} from '@colyseus/schema';
import {PlayerSchema} from './PlayerSchema';

import Config from '../../../shared/Config';

export class StateHandlerSchema extends Schema {

    @type({map: PlayerSchema})
    players = new MapSchema<PlayerSchema>();
    @type("number") serverTime: number = 0.0;

    addPlayer(sessionId: string) {
        this.players.set(sessionId, new PlayerSchema().assign({
            sessionId: sessionId,
            username: sessionId,
            x: 0,
            y: 0,
            z: 0,
            rot: 0,
        }));
    }

    getPlayer(sessionId: string): PlayerSchema {
        return this.players.get(sessionId);
    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    setSpawnPoint(sessionId: string, location:string) {
        let defaultSpawnPoint = Config.locations[location].spawnPoint;
        const player = this.getPlayer(sessionId);
        player.x = defaultSpawnPoint.x;
        player.y = 0;
        player.z = defaultSpawnPoint.z;
        console.log('SET SPAWN POINT', defaultSpawnPoint);
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
        player.x -= h * Config.PLAYER_SPEED;
        player.y = 0;
        player.z -= v * Config.PLAYER_SPEED;
        player.rot = Math.atan2(h, v);
        player.sequence = seq;
    }

    setLocation(sessionId, location){
        const player = this.getPlayer(sessionId);
        player.location = location;
    }

    setUsername(sessionId, username){
        const player = this.getPlayer(sessionId);
        player.username = username;
    }
   
    generateRandomUUID(){
        return Math.random().toString().substring(10,20);
    }

}