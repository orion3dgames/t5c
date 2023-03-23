import { Schema, type, MapSchema } from "@colyseus/schema";
import { EnemyState } from "./EnemyState";
import { PlayerState } from "./PlayerState";
import { ItemState } from "./ItemState";
import { GameRoom } from "../GameRoom";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { NavMesh } from "../../../shared/yuka";
import { nanoid } from "nanoid";
import Logger from "../../../shared/Logger";
import { randomNumberInRange } from "../../../shared/Utils";
import { AI_STATE } from "../../../shared/Entities/Entity/AIState";
import { dataDB } from "../../../shared/Data/dataDB";

export class GameRoomState extends Schema {
    // networked variables
    @type({ map: EnemyState }) entities = new MapSchema<EnemyState>();
    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
    @type({ map: ItemState }) items = new MapSchema<ItemState>();
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
        this.roomDetails = dataDB.get("location", this._gameroom.metadata.location);
    }

    public createEntity(delta) {
        // monster pool to chose from
        let monsterTypes = ["monster_unicorn", "monster_bear"];

        // random id
        let sessionId = nanoid(10);

        // get starting starting position
        let randomRegion = this.navMesh.getRandomRegion();
        let point = randomRegion.centroid;

        // random mesh
        let race = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];

        // get race data
        let raceData = dataDB.get("race", race);

        // create entity
        let data = {
            sessionId: sessionId,
            type: "entity",
            race: race,
            name: raceData.title + " #" + delta,
            location: this._gameroom.metadata.location,
            x: point.x,
            y: 0,
            z: point.z,
            rot: randomNumberInRange(0, Math.PI),
            health: raceData.baseHealth,
            mana: raceData.baseMana,
            maxHealth: raceData.baseHealth,
            maxMana: raceData.baseMana,
            level: 1,
            state: EntityCurrentState.IDLE,
            toRegion: false,
        };

        let entity = new EnemyState(this._gameroom, data);

        // add to colyseus state
        this.entities.set(sessionId, entity);

        // log
        Logger.info("[gameroom][state][createEntity] created new entity " + race + ": " + sessionId);
    }

    public createItem() {
        // get starting starting position
        let randomRegion = this.navMesh.getRandomRegion();
        let point = randomRegion.centroid;

        // drop item on the ground
        let sessionId = nanoid(10);
        let data = {
            key: "apple",
            name: "Apple",
            sessionId: sessionId,
            x: point.x,
            y: 0.25,
            z: point.z,
        };
        let entity = new ItemState(this, data);
        this.items.set(sessionId, entity);
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
            if (this.items.size < 20) {
                this.createItem();
            }
        }

        //////////////////////////////////////////////
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

    /**
     * Add player
     * @param sessionId
     * @param data
     */
    addPlayer(sessionId: string, data): void {
        let player = {
            id: data.id,
            sessionId: sessionId,
            type: "player",
            race: "player_hobbit",
            name: data.name,
            location: data.location,
            x: data.x,
            y: data.y,
            z: data.z,
            rot: data.rot,
            state: EntityCurrentState.IDLE,

            health: data.health,
            mana: data.mana,
            maxHealth: data.health,
            maxMana: data.mana,

            level: data.level,
            experience: data.experience,
            gold: data.gold,

            strength: 15,
            endurance: 16,
            agility: 15,
            intelligence: 20,
            wisdom: 20,

            abilities: data.abilities,
            inventory: data.inventory,
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
