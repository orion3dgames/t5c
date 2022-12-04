import { Schema, type, MapSchema } from '@colyseus/schema';
import { PlayerSchema } from './PlayerSchema';
import Logger from "../../../shared/Logger";
import Config from '../../../shared/Config';
import { PlayerCharacter } from '../../../shared/types';

export class StateHandlerSchema extends Schema {

    @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
    @type("number") serverTime: number = 0.0;
    public navMesh: any;

    addPlayer(sessionId: string, data: PlayerCharacter) {
        this.players.set(sessionId, new PlayerSchema().assign({
            id: data.id,
            sessionId: sessionId,
            name: data.name,
            location: data.location,
            x: data.x,
            y: data.y,
            z: data.z,
            rot: data.rot,
            health: data.health,
            level: data.level,
            experience: data.experience,
        }));
    }

    getPlayer(sessionId: string): PlayerSchema {
        return this.players.get(sessionId);
    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    setLocation(sessionId, location) {
        const player = this.getPlayer(sessionId);
        player.location = location;
    }

    setPosition(sessionId: string, x, y, z, rot) {
        const player = this.getPlayer(sessionId);
        player.x = x;
        player.y = y;
        player.z = z;
        player.rot = rot;
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
        let newRot;
        const newAngle = Math.atan2(h, v);

        const nOld = oldRot % 2 * Math.PI;
        const rotSpeed = 2;
        if (newAngle > nOld) {
            const d = newAngle - oldRot;
            if (d > Math.PI) {
                newRot = oldRot - ((2 * Math.PI) - (newAngle - nOld)) / rotSpeed
            }
            else
                newRot = oldRot + (newAngle - nOld) / rotSpeed
        }
        else {
            const d = oldRot - newAngle;
            if (d > Math.PI) {
                newRot = oldRot + (2 * Math.PI - (oldRot - newAngle)) / rotSpeed
            }
            else
                newRot = oldRot - (oldRot - newAngle) / rotSpeed
        }

        // check it fits in navmesh
        const foundPath: any = this.navMesh.findPath({ x: player.x, y: player.z }, { x: newX, y: newZ });

        if (foundPath && foundPath.length > 0) {

            // next position validated, update player
            player.x = newX;
            player.y = 0;
            player.z = newZ;
            player.rot = newRot;
            player.sequence = seq;
 
             // add player to server
            Logger.info('Valid position for '+player.name+': ( x: '+player.x+', y: '+player.y+', z: '+player.z+', rot: '+player.rot);

        } else {

            // collision detected, return player old position
            player.x = oldX;
            player.y = 0;
            player.z = oldZ;
            player.rot = oldRot;
            player.sequence = seq;

            Logger.warning('Invalid position for '+player.name+': ( x: '+player.x+', y: '+player.y+', z: '+player.z+', rot: '+player.rot);
        }
    }

    generateRandomUUID() {
        return Math.random().toString().substring(10, 20);
    }

}