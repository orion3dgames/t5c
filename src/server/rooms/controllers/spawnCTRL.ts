import { BrainSchema, LootSchema } from "../schema";
import { GameRoom } from "../GameRoom";
import { EntityState } from "../../../shared/Entities/Entity/EntityState";
import { nanoid } from "nanoid";
import Logger from "../../../shared/Logger";
import { randomNumberInRange } from "../../../shared/Utils";
import { dataDB } from "../../../shared/Data/dataDB";
import { GameRoomState } from "../state/GameRoomState";

export class spawnCTRL {
    private _state: GameRoomState;
    private _room: GameRoom;
    private _location;

    private spawnsAmount: {} = {
        area: 0,
        global: 0,
        path: 0,
    };

    constructor(state: GameRoomState) {
        this._state = state;
        this._room = state._gameroom;
        this._location = dataDB.get("location", this._room.metadata.location);
        this.process();
        this.processStatic();

        for (let i = 0; i < 25; i++) {
            this.createItem();
        }
    }

    public update() {
        this.process();
    }

    public process() {
        //Logger.info("[gameroom][state][spawning] spawnController: " + this._location.key);
        let dynamic = this._location.dynamic;
        let spawns = dynamic.spawns ?? [];
        spawns.forEach((spawnInfo) => {
            if (spawnInfo.type === "global") {
                this.spawn(spawnInfo);
            }
            if (spawnInfo.type === "area") {
                this.spawn(spawnInfo);
            }
            if (spawnInfo.type === "path") {
                this.spawn(spawnInfo);
            }
        });
    }

    public processStatic() {
        let dynamic = this._location.dynamic;
        let spawns = dynamic.spawns ?? [];
        spawns.forEach((spawnInfo) => {
            if (spawnInfo.type === "static") {
                this.spawnStatic(spawnInfo);
            }
        });
    }

    private spawn(e) {
        for (let i = 0; i < e.amount; i++) {
            if (this.spawnsAmount[e.type] < e.amount) {
                this.createEntity(e);
            }
        }
    }

    private spawnStatic(e) {
        e.x = e.points[0].x;
        e.y = e.points[0].y;
        e.z = e.points[0].z;
        this.createEntity(e);
    }

    public createItem(sender?) {
        // create drops
        let sessionId = nanoid(10);

        // monster pool to chose from
        let randTypes = ["sword_01", "amulet_01", "pear", "apple", "potion_heal"];
        let randResult = randTypes[Math.floor(Math.random() * randTypes.length)];
        let randData = dataDB.get("item", randResult);

        //
        let randomRegion = this._room.navMesh.getRandomRegion();
        let currentPosition = randomRegion.centroid;
        if (sender) {
            let currentPosition = sender.getPosition();
            currentPosition.x += randomNumberInRange(0.1, 1.5);
            currentPosition.z += randomNumberInRange(0.1, 1.5);
        }

        let data = {
            key: randData.key,
            sessionId: sessionId,
            x: currentPosition.x,
            y: 0.25,
            z: currentPosition.z,
            quantity: 1,
        };
        let entity = new LootSchema(this, data);
        this._state.entityCTRL.add(entity);

        Logger.info("[gameroom][state][createEntity] created new item " + data.key + ": " + sessionId);
    }

    public createEntity(spawnInfo) {
        // random id
        let sessionId = nanoid(10);

        // monster pool to chose from
        let raceData = dataDB.get("race", spawnInfo.race);

        // create entity
        let data = {
            sessionId: sessionId,
            type: "entity",
            race: raceData.key,
            name: spawnInfo.name,
            location: this._room.metadata.location,
            x: spawnInfo.x ?? 0,
            y: spawnInfo.y ?? 0,
            z: spawnInfo.z ?? 0,
            rot: randomNumberInRange(0, Math.PI),
            health: raceData.baseHealth,
            mana: raceData.baseMana,
            maxHealth: raceData.baseHealth,
            maxMana: raceData.baseMana,
            level: 1,
            state: EntityState.IDLE,
            toRegion: false,
            AI_SPAWN_INFO: spawnInfo,
        };

        //
        this.spawnsAmount[spawnInfo.type]++;

        // add to manager
        this._state.entityCTRL.add(new BrainSchema(this._state, data));

        // log
        Logger.info("[gameroom][state][createEntity] created new entity " + raceData.key + ": " + sessionId, spawnInfo);
    }

    removeEntity(entity) {
        this.spawnsAmount[entity.AI_SPAWN_INFO.type]--;

        this._state.entities.delete(entity.sessionId);
    }
}
