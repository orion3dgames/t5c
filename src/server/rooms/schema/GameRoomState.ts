import { Schema, type, MapSchema } from '@colyseus/schema';
import { PlayerState } from './PlayerState';
import { EntityState } from "./EntityState";
import { PlayerCharacter } from '../../../shared/types';
import { GameRoom } from '../GameRoom';
import { PlayerCurrentState } from '../../../shared/Entities/Player/PlayerCurrentState';
import { NavMesh, Vehicle, WanderBehavior, EntityManager, Time } from "yuka";
import { nanoid } from 'nanoid';

export class GameRoomState extends Schema {

    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
    @type({ map: EntityState }) entities = new MapSchema<EntityState>();
    @type("number") serverTime: number = 0.0;
    private _gameroom: GameRoom = null;
    private _navMesh: NavMesh = null;
    private entityManager;
    private time;

    constructor(gameroom: GameRoom, navMesh:NavMesh, ...args: any[]) {
		super(...args);
		this._gameroom = gameroom;
		this._navMesh = navMesh;

        
        this.entityManager = new EntityManager();
        this.time = new Time()
          
        let id = nanoid();
        const vehicle = new Vehicle()
        vehicle.navMesh = this._navMesh;
        vehicle._uuid = id;
        vehicle.name = "rat";
        vehicle.rotation.fromEuler(0, 2 * Math.PI * Math.random(), 0);
        vehicle.position.x = 1;
        vehicle.position.y = 1;
        vehicle.position.z = 1;
        const wanderBehavior = new WanderBehavior()
        vehicle.steering.add(wanderBehavior)
        this.entityManager.add(vehicle)

        this.entities.set('TEST', new EntityState(this._gameroom.navMesh, this._gameroom.database).assign({
            sessionId: id,
            type: "monster_bear",
            name: "Bear",
            location: "lh_town",
            x: 0,
            y: 0,
            z: 0,
            rot: 0,
            health: 100,
            level: 1,
            state: PlayerCurrentState.IDLE
        }));
        
	}

    public update(deltaTime: number) {

        
        const delta = this.time.update().getDelta()
        this.entityManager.update(delta);

        let entity = this.entityManager.entities[0];
        //this.entities['TEST'].x = entity.position.x;
        //console.log(entity);
        
	}

    getRandomArbitrary(min, max) {
        return (Math.random() * (max - min) + min);
    }

    addPlayer(sessionId: string, data: PlayerCharacter) {
        this.players.set(sessionId, new PlayerState(this._navMesh, this._gameroom.database).assign({
            id: data.id,
            sessionId: sessionId,
            type: 'player_hobbit',
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