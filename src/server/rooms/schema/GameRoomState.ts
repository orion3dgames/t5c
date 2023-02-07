import { Schema, type, MapSchema } from "@colyseus/schema";
import { EnemyState } from "./EnemyState";
import { PlayerState } from "./PlayerState";
import { PlayerCharacter } from "../../../shared/types";
import { GameRoom } from "../GameRoom";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { NavMesh } from "../../../shared/yuka";
import { nanoid } from "nanoid";
import Config from "../../../shared/Config";
import Logger from "../../../shared/Logger";
import { randomNumberInRange } from "../../../shared/Utils";
import { AI_STATE } from "../../../shared/Entities/Entity/AIState";
import Locations from "../../../shared/Data/Locations";
import { Races, Race } from "../../../shared/Entities/Common/Races";

export class GameRoomState extends Schema {
    // networked variables
    @type({ map: EnemyState }) entities = new MapSchema<EnemyState>();
    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
    @type("number") serverTime: number = 0.0;

    // not networked variables
    private _gameroom: GameRoom = null;
    public navMesh: NavMesh = null;
    private timer: number = 0;
    private spawnTimer: number = 0;

    private roomDetails;

    constructor(gameroom: GameRoom, _navMesh: NavMesh, ...args: any[]) {
        super(...args);
        this._gameroom = gameroom;
        this.navMesh = _navMesh;
        this.roomDetails = Locations[this._gameroom.metadata.location];
    }

    public createEntity(delta) {
        // monster pool to chose from
        let monsterTypes = ["monster_unicorn", "monster_bear"];

        // random id
        let sessionId = nanoid();

        // get starting starting position
        let randomRegion = this.navMesh.getRandomRegion();
        let point = randomRegion.centroid;

        // random mesh
        let race = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];

        // get race data
        let raceData: Race = Races.get(race);

        // create entity
        let data = {
            sessionId: sessionId,
            type: "entity",
            race: race,
            name: raceData.name + " #" + delta,
            location: this._gameroom.metadata.location,
            x: point.x,
            y: 0,
            z: point.z,
            rot: randomNumberInRange(0, Math.PI),
            health: raceData.maxHealth,
            level: 1,
            state: EntityCurrentState.IDLE,
            toRegion: false,
            raceData: raceData,
        };

        let entity = new EnemyState(this._gameroom, data);

        entity.setRandomDestination(point);

        // add to colyseus state
        this.entities.set(sessionId, entity);

        // log
        Logger.info("[gameroom][state][createEntity] created new entity " + race + ": " + sessionId);
    }

    public update(deltaTime: number) {
        //////////////////////////////////////////////
        // entity spawning script (span a monster every .5 second)
        this.spawnTimer += deltaTime;
        let spawnTime = 300;
        if (this.spawnTimer >= spawnTime) {
            this.spawnTimer = 0;
            let maxEntities = this.roomDetails.monsters;
            if (this.entities.size < maxEntities) {
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
            if (this.entities.size > 0) {
                this.entities.forEach((entity) => {
                    // entity update
                    entity.update();

                    // only move non playing entities
                    if (entity.type === "entity") {
                        if (entity.AI_CURRENT_STATE === AI_STATE.IDLE) {
                        } else if (entity.AI_CURRENT_STATE === AI_STATE.SEEKING) {
                            entity.seek();
                        } else if (entity.AI_CURRENT_STATE === AI_STATE.WANDER) {
                            entity.wander();
                        } else if (entity.AI_CURRENT_STATE === AI_STATE.ATTACKING) {
                            entity.attack();
                        }
                    }
                });
            }

            // for each players
            if (this.players.size > 0) {
                this.players.forEach((player) => {
                    player.update();
                });
            }
        }
    }

    /**
     * Add player
     * @param sessionId
     * @param data
     */
    addPlayer(sessionId: string, data: PlayerCharacter): void {
        let race = "player_hobbit";
        let raceData = Races.get(race);
        let player = {
            id: data.id,
            sessionId: sessionId,
            type: "player",
            race: race,
            name: data.name,
            location: data.location,
            x: data.x,
            y: data.y,
            z: data.z,
            rot: data.rot,
            health: raceData.maxHealth,
            mana: raceData.maxMana,
            level: data.level,
            experience: data.experience,
            state: EntityCurrentState.IDLE,
        };
        this.players.set(sessionId, new PlayerState(this._gameroom, player));
    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    removeEntity(sessionId: string) {
        this.entities.delete(sessionId);
    }
}
