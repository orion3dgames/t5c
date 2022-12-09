import { Schema, type, MapSchema } from '@colyseus/schema';
import { PlayerState } from './PlayerState';
import { EntityState } from "./EntityState";
import { PlayerCharacter } from '../../../shared/types';
import { GameRoom } from '../GameRoom';
import { PlayerCurrentState } from '../../../shared/Entities/Player/PlayerCurrentState';
import { NavMesh } from "yuka";

export class GameRoomState extends Schema {

    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
    @type({ map: EntityState }) entities = new MapSchema<EntityState>();
    @type("number") serverTime: number = 0.0;
    private _gameroom: GameRoom = null;
    private _navmesh:NavMesh;
    private _navPoint;
    private timer = 0;

    constructor(gameroom: GameRoom, navMesh, ...args: any[]) {
		super(...args);
		this._gameroom = gameroom;
        //this._navPoint = this._gameroom.navMesh.getPolygons();
	}

    public update(deltaTime: number) {

        /*
        // only spawn in dungeon
        if(this._gameroom.metadata.location === "lh_dungeon_01"){

            // add entity up to maxEntities
            let maxEntities = 10;
            while(this.entities.size < maxEntities){
                let id = nanoid();
                let randomNavMeshPoint = this._navPoint[Math.floor(Math.random()*this._navPoint.length)];
                let point = randomNavMeshPoint.getPoints()[0];

                // create entity on server
                this.entities.set(id, new EntityState(this._gameroom.navMesh, this._gameroom.database).assign({
                    sessionId: id,
                    type: "entity",
                    name: "Rat",
                    location: "lh_dungeon_01",
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


        this.timer += deltaTime;
        let spawnTime = 100;
        if (this.timer >= spawnTime) {

            this.timer = 0;

            // move entities randomly
            this.entities.forEach(entity => {

                // if entity does not have a destination, give it one
                // ideally should be a point in the navmesh
                // todo: build a function to get a random point in navmesh in a specific range around spawnpoint
                if(!entity.destination){
                    let dest = {
                        x: this.getRandomArbitrary(-16,12),
                        z: this.getRandomArbitrary(-9,7),
                    }
                    entity.destination = this._gameroom.navMesh.findPath({ x: entity.x, y: entity.z }, { x: dest.x, y: dest.z });
                    
                    if(entity.destination){
                        entity.destination.shift();
                    }
                  
                }

                if(entity.destination){
                    
                    let destinationOnPath = entity.destination[0];

                    let precision = 3;
                    let speed = 0.2;

                    let currentX = entity.x;
                    let currentZ = entity.z;
                    let targetX = destinationOnPath.x;
                    let targetZ = destinationOnPath.y;

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
                        roundTo(destinationOnPath.y, precision) === roundTo(entity.z, precision) 
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
        */

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