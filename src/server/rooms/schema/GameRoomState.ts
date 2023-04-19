import { Schema, type, MapSchema } from "@colyseus/schema";
import { EnemyState } from "./EnemyState";
import { PlayerData, PlayerState } from "./PlayerState";
import { LootState } from "./LootState";
import { GameRoom } from "../GameRoom";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { NavMesh } from "../../../shared/yuka";
import { nanoid } from "nanoid";
import Logger from "../../../shared/Logger";
import { randomNumberInRange } from "../../../shared/Utils";
import { AI_STATE } from "../../../shared/Entities/Entity/AIState";
import { dataDB } from "../../../shared/Data/dataDB";
import { Client } from "colyseus";
import { GetLoot, LootTableEntry } from "../../../shared/Entities/Player/LootTable";

export class GameRoomState extends Schema {
    // networked variables
    @type({ map: EnemyState }) entities = new MapSchema<EnemyState>();
    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
    @type({ map: LootState }) items = new MapSchema<LootState>();
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
        // random id
        let sessionId = nanoid(10);

        // get starting starting position
        let randomRegion = this.navMesh.getRandomRegion();
        let point = randomRegion.centroid;

        // monster pool to chose from
        let randTypes = ["monster_unicorn", "monster_bear"];
        let randResult = randTypes[Math.floor(Math.random() * randTypes.length)];
        let randData = dataDB.get("race", randResult);

        // create entity
        let data = {
            sessionId: sessionId,
            type: "entity",
            race: randData.key,
            name: randData.title + " #" + delta,
            location: this._gameroom.metadata.location,
            x: point.x,
            y: 0,
            z: point.z,
            rot: randomNumberInRange(0, Math.PI),
            health: randData.baseHealth,
            mana: randData.baseMana,
            maxHealth: randData.baseHealth,
            maxMana: randData.baseMana,
            level: 1,
            state: EntityCurrentState.IDLE,
            toRegion: false,
        };

        let entity = new EnemyState(this._gameroom, data);

        // add to colyseus state
        this.entities.set(sessionId, entity);

        // log
        Logger.info("[gameroom][state][createEntity] created new entity " + randData.key + ": " + sessionId);
    }

    public createItem() {
        // get starting starting position
        let randomRegion = this.navMesh.getRandomRegion();
        let point = randomRegion.centroid;

        // set up loot
        let lootTable = [
            LootTableEntry("potion_heal", 25, 1, 1, 1, 1),
            LootTableEntry("pear", 5, 1, 10, 1, 1),
            LootTableEntry("apple", 20, 1, 10, 1, 1),
            LootTableEntry(null, 20, 1, 1, 1, 1),
            LootTableEntry("amulet_01", 1, 1, 1, 1, 2),
            LootTableEntry(null, 150, 1, 1, 1, 2),
        ];
        // generate loot
        let loot = GetLoot(lootTable);

        // iterate loot
        loot.forEach((drop) => {
            // drop item on the ground
            let item = dataDB.get("item", drop.id);
            let sessionId = nanoid(10);
            let currentPosition = point;
            currentPosition.x += randomNumberInRange(0.1, 1.5);
            currentPosition.z += randomNumberInRange(0.1, 1.5);
            let data = {
                key: drop.id,
                name: item.name,
                sessionId: sessionId,
                x: currentPosition.x,
                y: 0.25,
                z: currentPosition.z,
                quantity: drop.quantity,
            };
            let entity = new LootState(this, data);
            this.items.set(sessionId, entity);
            Logger.info("[gameroom][state][createEntity] created new item " + item.key + ": " + sessionId);
        });
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
            if (this.items.size < 5) {
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
    addPlayer(client: Client): void {
        // prepare player data
        let data = client.auth;
        let player = {
            id: data.id,

            x: data.x,
            y: data.y,
            z: data.z,
            rot: data.rot,

            health: data.health,
            maxHealth: data.health,
            mana: data.mana,
            maxMana: data.mana,
            level: data.level,

            sessionId: client.sessionId,
            name: data.name,
            type: "player",
            race: "player_hobbit",

            location: data.location,
            sequence: 0,
            blocked: false,
            state: EntityCurrentState.IDLE,

            gold: data.gold ?? 0,
            strength: 15,
            endurance: 16,
            agility: 15,
            intelligence: 20,
            wisdom: 20,
            experience: data.experience ?? 0,

            default_abilities: data.abilities ?? [],
            default_inventory: data.inventory ?? [],
        };

        this._gameroom.state.players.set(client.sessionId, new PlayerState(this._gameroom, player));

        // set player as online
        this._gameroom.database.toggleOnlineStatus(client.auth.id, 1);

        // log
        Logger.info(`[gameroom][onJoin] player ${client.sessionId} joined room ${this._gameroom.roomId}.`);
    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    removeEntity(sessionId: string) {
        this.entities.delete(sessionId);
    }
}
