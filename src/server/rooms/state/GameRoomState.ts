import { Schema, type, MapSchema, filterChildren } from "@colyseus/schema";
import { PlayerSchema } from "../schema/PlayerSchema";
import { Player } from "../brain/Player";
import { YukaSchema } from "../schema/YukaSchema";
import { LootSchema } from "../schema/LootSchema";
import { Enemy } from "../brain/Enemy";
import { spawnCTRL } from "../controllers/spawnCTRL";
import { GameRoom } from "../GameRoom";
import { EntityState } from "../../../shared/Entities/Entity/EntityState";
import { NavMesh, EntityManager, Time } from "../../../shared/yuka";
import { nanoid } from "nanoid";
import Logger from "../../../shared/Logger";
import { randomNumberInRange } from "../../../shared/Utils";
import { dataDB } from "../../../shared/Data/dataDB";
import { Client } from "colyseus";
import { GetLoot, LootTableEntry } from "../../../shared/Entities/Player/LootTable";
import IdleState from "../brain/states/IdleState";

export class GameRoomState extends Schema {
    // networked variables
    /*
    @filterChildren(function (client, key, value: PlayerState, root) {
        const isSelf = value.name === client.sessionId;
        const player = (this as GameRoomState).players.get(client.sessionId);
        const isWithinXBounds = Math.abs(player.x - value.x) < Config.PLAYER_VIEW_DISTANCE;
        const isWithinZBounds = Math.abs(player.z - value.z) < Config.PLAYER_VIEW_DISTANCE;
        const isWithinBounds = isWithinXBounds && isWithinZBounds;
        return isSelf || isWithinBounds;
    })*/
    @type({ map: YukaSchema }) entities = new MapSchema<YukaSchema>();
    @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
    @type({ map: LootSchema }) items = new MapSchema<LootSchema>();
    @type("number") serverTime: number = 0.0;

    // not networked variables
    public _gameroom: GameRoom = null;
    private _spawnController: spawnCTRL;
    public navMesh: NavMesh = null;
    private timer: number = 0;
    private spawnTimer: number = 0;
    private roomDetails;

    public entityManager;
    public time;

    constructor(gameroom: GameRoom, _navMesh: NavMesh, ...args: any[]) {
        super(...args);
        this._gameroom = gameroom;
        this.navMesh = _navMesh;
        this.roomDetails = dataDB.get("location", this._gameroom.metadata.location);
        //this._spawnController = new spawnController(this);

        this.entityManager = new EntityManager();
        this.time = new Time();

        // add entity
        this.createEntity(1);
    }

    public update(deltaTime: number) {
        const delta = this.time.update().getDelta();

        this.entityManager.update(delta);

        // for each players
        /*
        if (this.players.size > 0) {
            this.players.forEach((player) => {
                player.update();
            });
        }*/
    }

    getEntities() {
        return this.entityManager.entities;
    }

    public createEntity(delta) {
        // random id
        let sessionId = nanoid(10);

        // get starting starting position
        let randomRegion = this.navMesh.getRandomRegion();
        let point = randomRegion.centroid;

        // monster pool to chose from
        let randTypes = ["male_enemy"];
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
            state: EntityState.IDLE,
            toRegion: false,
        };

        // add to yuka
        const girl = new Enemy(this, data);
        this.entityManager.add(girl);

        // log
        Logger.info("[gameroom][state][createEntity] created new entity " + randData.key + ": " + sessionId);
    }

    /**
     * Add player
     * @param sessionId
     * @param data
     */
    addPlayer(client: Client, AI_MODE = false): void {
        // prepare player data

        let data = client.auth;

        let player_data = {
            strength: 15,
            endurance: 16,
            agility: 15,
            intelligence: 20,
            wisdom: 20,
            experience: data.experience ?? 0,
            gold: data.gold ?? 0,
        };

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
            race: "male_adventurer",

            location: data.location,
            sequence: 0,
            blocked: false,
            state: EntityState.IDLE,

            player_data: player_data,
            abilities: data.abilities ?? [],
            inventory: data.inventory ?? [],
        };

        //console.log(player);

        this.entityManager.add(new Player(this, player));

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

    /**
     * find a entity in yuka game manager
     * @param sessionId
     * @returns
     */
    getEntityBySessionId(sessionId) {
        const entities = this.entityManager.entities;
        for (let i = 0, l = entities.length; i < l; i++) {
            const entity = entities[i];
            if (entity.sessionId === sessionId) return entity;
        }
        return null;
    }
}
