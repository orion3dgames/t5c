import { Schema, type, MapSchema } from '@colyseus/schema';
import { PlayerState } from './PlayerState';
import { EntityState } from "./EntityState";
import { PlayerCharacter } from '../../../shared/types';
import { GameRoom } from '../GameRoom';
import { PlayerCurrentState } from '../../../shared/Entities/Player/PlayerCurrentState';
import { NavMesh, EntityManager, Time, Vector3, MovingEntity,GameEntity, FollowPathBehavior } from "yuka";
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
        if(this._gameroom.metadata.location === "lh_dungeon_01"){
            let maxEntities = 4;
            let monsterTypes = ['monster_unicorn', 'monster_bear'];
            while(this.entities.size < maxEntities){

                // random id
                let id = nanoid();

                // get starting starting position
                let randomRegion = this._navMesh.getRandomRegion();
                let point = randomRegion.centroid;

                // random mesh
                let type = monsterTypes[Math.floor(Math.random()*monsterTypes.length)];

                // create entity
                this.entities.set(id, new EntityState(this._gameroom.navMesh, this._gameroom.database).assign({
                    sessionId: id,
                    type: type,
                    name: "Monster "+this.entities.size,
                    location: "lh_dungeon_01",
                    x: point.x,
                    y: 0,
                    z: point.y,
                    rot: 0,
                    health: 100,
                    level: 1,
                    state: PlayerCurrentState.IDLE,
                    currentRegion: randomRegion,
                    toRegion: false,
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

                // save current position
                let currentPos = new Vector3(entity.x, entity.y,entity.z);

                // if entity does not have a destination, find one
                if(!entity.toRegion){
                    entity.toRegion = this._navMesh.getRandomRegion();
                    entity.destinationPath = this._gameroom.navMesh.findPath(
                        currentPos,
                        entity.toRegion.centroid
                    );
                    if(entity.destinationPath.length === 0){
                        entity.toRegion = false;
                        entity.destinationPath = false;
                    }
                }

                // move entity
                if(entity.destinationPath.length > 0){

                    let destinationOnPath = entity.destinationPath[0];
                    destinationOnPath.y = 0;
                    let speed = 0.5;

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
                    let updatedPos = new Vector3(entity.x, entity.y,entity.z);

                    // calculate rotation
                    // todo: dayd to find the right rotation here
                    let newRotation = currentPos.angleTo(updatedPos);
                    entity.rot = this.radians_to_degrees(newRotation);

                    // check if arrived a path vector
                    if(destinationOnPath.equals(updatedPos)){
                        entity.destinationPath.shift();
                    }

                    // update current region
                    entity.currentRegion = this._navMesh.getClosestRegion( currentPos );

                    // if arrived at final destination, set toRegion to false so it'll be update at next iteration
                    if(entity.currentRegion === entity.toRegion){
                        entity.toRegion = false;
                        entity.destinationPath = false;
                    }

                }else{

                    // something is wrong, let's look for a new destination
                    entity.toRegion = false;
                    entity.destinationPath = false;

                }
    
            });

        }
    
	}

    radians_to_degrees(radians)
    {
        var pi = Math.PI;
        return radians * (180/pi);
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