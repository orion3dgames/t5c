import { Schema, type, MapSchema } from '@colyseus/schema';
import { PlayerState } from './PlayerState';
import { PlayerCharacter } from '../../../shared/types';
import { GameRoom } from '../GameRoom';
import { PlayerCurrentState } from '../../../shared/Entities/Player/PlayerCurrentState';

export class GameRoomState extends Schema {

    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
    @type("number") serverTime: number = 0.0;
    private _room: GameRoom = null;

    constructor(room: GameRoom, ...args: any[]) {
		super(...args);
		this._room = room;
	}

    public update(deltaTime: number) {

	}

    addPlayer(sessionId: string, data: PlayerCharacter) {
        this.players.set(sessionId, new PlayerState(this._room.navMesh, this._room.database).assign({
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
            state: PlayerCurrentState.IDLE
        }));

    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

}