import { Schema, type, MapSchema } from '@colyseus/schema';
import { EntityState } from "./EntityState";
import { PlayerState } from './PlayerState';
import { PlayerCharacter } from '../../../shared/types';
import { GameRoom } from '../GameRoom';
import { EntityCurrentState } from '../../../shared/Entities/Entity/EntityCurrentState';
import { NavMesh } from "../../../shared/yuka";
import { nanoid } from 'nanoid';
import Config from '../../../shared/Config';
import Logger from "../../../shared/Logger";
import { randomNumberInRange } from '../../../shared/Utils';
import { AI_STATE } from "../../../shared/Entities/Entity/AIState";


export class GameRoomState extends Schema {

    // networked variables
    @type({ map: EntityState }) entities = new MapSchema<EntityState>();
    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
    @type("number") serverTime: number = 0.0;
    
    // not networked variables
    private _gameroom: GameRoom = null;
    public navMesh: NavMesh = null;
    private timer: number = 0;
    private spawnTimer: number = 0;

    constructor(gameroom: GameRoom, _navMesh: NavMesh, ...args: any[]) {
		super(...args);
		this._gameroom = gameroom;
		this.navMesh = _navMesh;
	}

    public createEntity(delta){

        // monster pool to chose from
        let monsterTypes = ['monster_unicorn', 'monster_bear'];

        // random id
        let sessionId = nanoid();

        // get starting starting position
        let randomRegion = this.navMesh.getRandomRegion();
        let point = randomRegion.centroid;

        // random mesh
        let race = monsterTypes[Math.floor(Math.random()*monsterTypes.length)];

        // get race data
        let raceData = Config.entities[race];

        // create entity
        let data = {
            sessionId: sessionId,
            type: 'entity', 
            race: race,
            name: raceData.name+" #"+delta,
            location: this._gameroom.metadata.location,
            x: point.x,
            y: 0,
            z: point.z,
            rot: randomNumberInRange(0, Math.PI),  
            health: 100,
            level: 1,
            state: EntityCurrentState.IDLE,
            toRegion: false,
            raceData: raceData
        };

        let entity = new EntityState(this._gameroom).assign(data);

        entity.setRandomDestination(point);

        // add to colyseus state
        this.entities.set(sessionId, entity);

        // log
        Logger.info("[gameroom][state][createEntity] created new entity "+race+": "+sessionId);
    }

    public update(deltaTime: number) {

        //////////////////////////////////////////////
        // entity spawning script (span a monster every .5 second)
        this.spawnTimer += deltaTime;
        let spawnTime = 300;
        if (this.spawnTimer >= spawnTime) {
            this.spawnTimer = 0;
            let maxEntities = 10; 
            if(this.entities.size <= maxEntities){
                this.createEntity(this.entities.size);
            }
        }

        //////////////////////////////////////////////
        // entity moving script 
        this.timer += deltaTime;
        let refreshRate = 100;
        if (this.timer >= refreshRate) {
            this.timer = 0;

            // for each entity
            if( this.entities.size > 0){
                this.entities.forEach(entity => { 
1
                    // entity update
                    entity.update();

                    // only move non playing entities
                    if(entity.type === 'entity'){
                        if (entity.AI_CURRENT_STATE === AI_STATE.IDLE) {
 
                        }else if (entity.AI_CURRENT_STATE === AI_STATE.SEEKING) {
                            entity.seek();
                        }else if (entity.AI_CURRENT_STATE === AI_STATE.WANDER) {
                            entity.wander();
                        }else if (entity.AI_CURRENT_STATE === AI_STATE.ATTACKING) {
                            entity.attack();
                        }
                    }
                });
            }

            // for each players
            if( this.players.size > 0){
                this.players.forEach(entity => {
                    entity.update();
                });
            }

        }
        
	}

    /**
     * Add player
     * @param sessionId 
     * @param data 
     */
    addPlayer(sessionId: string, data: PlayerCharacter):void {

        this.players.set(sessionId, new PlayerState(this._gameroom).assign({
            id: data.id,
            sessionId: sessionId,
            type: 'player',
            race: 'player_hobbit',
            name: data.name,
            location: data.location,
            x: data.x,
            y: data.y,
            z: data.z,
            rot: data.rot,
            health: data.health,
            level: data.level,
            experience: data.experience,
            state: EntityCurrentState.IDLE
        }));

    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    removeEntity(sessionId: string) {
        this.entities.delete(sessionId);
    }

}