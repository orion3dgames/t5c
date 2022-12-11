import { Schema, type, MapSchema } from '@colyseus/schema';
import { PlayerState } from './PlayerState';
import { EntityState } from "./EntityState";
import { PlayerCharacter } from '../../../shared/types';
import { GameRoom } from '../GameRoom';
import { PlayerCurrentState } from '../../../shared/Entities/Player/PlayerCurrentState';
import { NavMesh, Vehicle, WanderBehavior, EntityManager, Time, GameEntity, SteeringBehavior } from "yuka";
import { nanoid } from 'nanoid';
import { ThinSprite } from 'babylonjs/Sprites/thinSprite';

export class GameRoomState extends Schema {

    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
    @type({ map: Vehicle }) entities = new MapSchema<Vehicle>();
    @type("number") serverTime: number = 0.0;
    private _gameroom: GameRoom = null;
    private _navmesh:NavMesh;
    private entityManager;
    private time;
    private timer: number;

    @type("string") _navmesh2:NavMesh;

    constructor(gameroom: GameRoom, navMesh:NavMesh, ...args: any[]) {
		super(...args);
		this._gameroom = gameroom;

        /*
        this.entityManager = new EntityManager();
        this.time = new Time()
         
        const vehicle = new Vehicle()
        const wanderBehavior = new WanderBehavior()
        vehicle.steering.add(wanderBehavior)
        this.entityManager.add(vehicle)

        this.entities = this.entityManager.entities;*/
/*
        let id = nanoid();
        this.entities.set('TEST', new EntityState(this._gameroom.navMesh, this._gameroom.database).assign({
            sessionId: id,
            type: "entity",
            name: "Rat",
            location: "lh_dungeon_01",
            x: 0,
            y: 0,
            z: 0,
            rot: 0,
            health: 100,
            level: 1,
            state: PlayerCurrentState.IDLE
        }));*/
        
	}

    public update(deltaTime: number) {

        /*
        const delta = this.time.update().getDelta()
        this.entityManager.update(delta);
        */
        //this.entities['TEST'].x += 0.001; 
        
	}

    getRandomArbitrary(min, max) {
        return (Math.random() * (max - min) + min);
    }

    addPlayer(sessionId: string, data: PlayerCharacter) {
        this.players.set(sessionId, new PlayerState(this._gameroom.navMesh, this._gameroom.database).assign({
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