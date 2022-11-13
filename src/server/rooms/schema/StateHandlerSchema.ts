import {Schema, type, MapSchema} from '@colyseus/schema';
import {PlayerSchema} from './PlayerSchema';

export class StateHandlerSchema extends Schema {

    @type({map: PlayerSchema})
    players = new MapSchema<PlayerSchema>();
    @type("number") serverTime: number = 0.0;

    addPlayer(sessionId: string) {
        let min = -10;
        let max = 10;
        this.players.set(sessionId, new PlayerSchema().assign({
            sessionId: sessionId,
            username: sessionId,
            x: Math.floor(Math.random() * (max - min + 1)) + min,
            y: 0,
            z: Math.floor(Math.random() * (max - min + 1)) + min,
            rot: 0,
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

        // prepare velocity
        let velocityX = 0
        let velocityZ = 0
        let velocityY = 0

        // this should work // model needs to be rotated I think // ask dayd :), EDIT : yes, you were not far ;)
        let rotationY = Math.atan2(h, v);

        // create forces from input
        velocityX = h;
        velocityZ = v;
        velocityY = 0; // jump or keep going down

        const player = this.getPlayer(sessionId);
        player.x -= velocityX;
        player.y = velocityY;
        player.z -= velocityZ;
        player.rot = rotationY;
        player.sequence = seq;

    }

    generateRandomUUID(){
        return Math.random().toString().substring(10,20);
    }

}