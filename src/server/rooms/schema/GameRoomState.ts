import { Schema, type, MapSchema } from '@colyseus/schema';
import { PlayerState } from './PlayerState';
import { EntityState } from "./EntityState";
import { PlayerCharacter } from '../../../shared/types';
import { GameRoom } from '../GameRoom';
import { PlayerCurrentState } from '../../../shared/Entities/Player/PlayerCurrentState';
import { NavMesh, EntityManager, Time, Vector3 } from "yuka";
import { nanoid } from 'nanoid';
import { roundTo } from "../../../shared/Utils";

export class GameRoomState extends Schema {

    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
    @type({ map: EntityState }) entities = new MapSchema<EntityState>();
    @type("number") serverTime: number = 0.0;
    private _gameroom: GameRoom = null;
    private _navMesh: NavMesh = null;
    private entityManager;
    private time;
    private timer: number = 0;

    constructor(gameroom: GameRoom, navMesh:NavMesh, ...args: any[]) {
		super(...args);
		this._gameroom = gameroom;
		this._navMesh = navMesh;

        this.entityManager = new EntityManager();
        this.time = new Time()
       
        // add to colyseus
        if(this._gameroom.metadata.location === "lh_town"){
            let maxEntities = 20;
            while(this.entities.size < maxEntities){
                let id = nanoid();
                let randomRegion = this._navMesh.getRandomRegion();
                let point = randomRegion.centroid;

                // create entity on server
                this.entities.set(id, new EntityState(this._gameroom.navMesh, this._gameroom.database).assign({
                    sessionId: id,
                    type: "entity",
                    name: "Rat",
                    location: "lh_town",
                    x: point.x,
                    y: 0,
                    z: point.y,
                    rot: 0,
                    health: 100,
                    level: 1,
                    state: PlayerCurrentState.IDLE
                }));

            }
        }
        
	}

    public update(deltaTime: number) {

        this.timer += deltaTime;
        let spawnTime = 100;
        if (this.timer >= spawnTime) {

            this.timer = 0;

            // move entities randomly
            this.entities.forEach(entity => {

                // if entity does not have a destination, give it one
                // ideally should be a point in the navmesh
                if(!entity.destination){

                    let randomRegion = this._navMesh.getRandomRegion();
                    let point = randomRegion.centroid;
                    let destination = new Vector3(point.x, point.y, point.z);

                    entity.destination = this._gameroom.navMesh.findPath(
                        { x: entity.x, y: entity.y, z: entity.z },
                        { x: destination.x, y: destination.y, z: destination.z }
                    );

                    console.log('first destination', entity.destination[0]);
          
                    if(entity.destination){
                        entity.destination.shift();
                    }
                  
                }

                if(entity.destination.length > 0){
                    
                    let destinationOnPath = entity.destination[0];
                    let precision = 3;
                    let speed = 0.2;

                    let currentX = entity.x;
                    let currentZ = entity.z;
                    let targetX = destinationOnPath.x;
                    let targetZ = destinationOnPath.z;

                    if(targetX < currentX){
                        entity.x -= speed;
                        if(entity.x < targetX){
                            entity.x = targetX;
                        }
                    }
                    
                    if(targetX > currentX){
                        entity.x += speed;
                        if(entity.x > targetX){
                            entity.x = targetX;
                        }
                    }
                    
                    if(targetZ < currentZ){
                        entity.z -= speed;
                        if(entity.z < targetZ){
                            entity.z = targetZ;
                        }
                    }
                    
                    if(targetZ > currentZ){
                        entity.z += speed;
                        if(entity.z > targetZ){
                            entity.z = targetZ;
                        }
                    }


                    // calculate rotation
                    if(
                        roundTo(destinationOnPath.x, precision) === roundTo(entity.x, precision) && 
                        roundTo(destinationOnPath.z, precision) === roundTo(entity.z, precision) 
                    ){
                        //console.log('ARRIVED AT DESTINATION', roundTo(destinationOnPath.x, precision), roundTo(entity.x, precision));
                        entity.destination.shift();
                        if(entity.destination.length < 1){
                            entity.destination = false;
                        }
                    }
                    

                }
    
            });

        }
    
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