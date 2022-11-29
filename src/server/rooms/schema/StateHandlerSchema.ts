import {Schema, type, MapSchema} from '@colyseus/schema';
import {PlayerSchema} from './PlayerSchema';
import Logger from "../../../shared/Logger";
import Config from '../../../shared/Config';
import { PlayerCharacter } from '../../../shared/types';

export class StateHandlerSchema extends Schema {

    @type({map: PlayerSchema}) players = new MapSchema<PlayerSchema>();
    @type("number") serverTime: number = 0.0;
    public navMesh: any;

    addPlayer(sessionId: string, data:PlayerCharacter) {
        this.players.set(sessionId, new PlayerSchema().assign({
            sessionId: sessionId,
            username: data.name,
            location: data.location,
            x: data.x,
            y: data.y,
            z: data.z,
            rot: data.rot,
        }));
    }

    getPlayer(sessionId: string): PlayerSchema {
        return this.players.get(sessionId);
    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    setLocation(sessionId, location){
        const player = this.getPlayer(sessionId);
        player.location = location;
    }

    calculatePosition(sessionId: string, h: number, v: number, seq: number) {
        const player = this.getPlayer(sessionId);

        // save current position
        let oldX = player.x;
        let oldZ = player.z;
        let oldRot = player.rot;

        // calculate new position
        let newX = player.x - (h * Config.PLAYER_SPEED);
        let newZ = player.z - (v * Config.PLAYER_SPEED);
        let newRot = Math.atan2(h, v);

        // check it fits in navmesh
        const foundPath: any = this.navMesh.findPath({ x: player.x, y: player.z }, { x: newX, y: newZ });

        if (foundPath && foundPath.length > 0){

            // next position validated, update player
            player.x = newX;
            player.y = 0;
            player.z = newZ;
            player.rot = newRot;
            player.sequence = seq;

             // add player to server
            Logger.info('Valid position for '+player.username+': ( x: '+player.x+', y: '+player.y+', z: '+player.z+', rot: '+player.rot);

        }else{

            // collision detected, return player old position
            player.x = oldX;
            player.y = 0;
            player.z = oldZ;
            player.rot = oldRot;
            player.sequence = seq;

            Logger.warning('Invalid position for '+player.username+': ( x: '+player.x+', y: '+player.y+', z: '+player.z+', rot: '+player.rot);
        }
    }
   
    generateRandomUUID(){
        return Math.random().toString().substring(10,20);
    }

}