import { BrainSchema } from "../schema";
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
    }

    public update() {
        this.process();
    }

    public process() {
        Logger.info("[gameroom][state][spawning] spawnController: " + this._location.key);
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

    private spawn(e) {
        for (let i = 0; i < e.amount; i++) {
            if (this.spawnsAmount[e.type] < e.amount) {
                this.createEntity(i, e);
            }
        }
    }

    private createEntity(delta, spawnInfo) {
        // random id
        let sessionId = nanoid(10);

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
            location: this._room.metadata.location,
            x: 0,
            y: 0,
            z: 0,
            rot: randomNumberInRange(0, Math.PI),
            health: randData.baseHealth,
            mana: randData.baseMana,
            maxHealth: randData.baseHealth,
            maxMana: randData.baseMana,
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
        Logger.info("[gameroom][state][createEntity] created new entity " + randData.key + ": " + sessionId, spawnInfo);
    }

    removeEntity(entity) {
        this.spawnsAmount[entity.AI_SPAWN_INFO.type]--;

        this._state.entities.delete(entity.sessionId);
    }
}
