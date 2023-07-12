import { BrainSchema1 } from "../schema/BrainSchema1";
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

    constructor(state: GameRoomState) {
        this._state = state;
        this._room = state._gameroom;
        this._location = dataDB.get("location", this._room.metadata.location);
        this.process();
    }

    public process() {
        Logger.info("[gameroom][state][spawning] spawnController: " + this._location.key);
        let dynamic = this._location.dynamic;
        let spawns = dynamic.spawns ?? [];
        spawns.forEach((spawnInfo) => {
            if (spawnInfo.type === "global") {
                this.global(spawnInfo);
            }
        });
    }

    private global(e) {
        for (let i = 0; i < e.amount; i++) {
            this.createEntity(i, e);
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
            location: this._location.key,
            x: 0,
            y: 0,
            z: 0,
            rot: 0,
            health: randData.baseHealth,
            mana: randData.baseMana,
            maxHealth: randData.baseHealth,
            maxMana: randData.baseMana,
            level: 1,
            state: EntityState.IDLE,
            toRegion: false,
            AI_SPAWN_INFO: spawnInfo,
        };

        let entity = new BrainSchema1(this._room, data);

        // add to colyseus state
        this._state.entities.set(sessionId, entity);

        // log
        Logger.info("[gameroom][state][createEntity] created new entity " + randData.key + ": " + sessionId);
    }
}
