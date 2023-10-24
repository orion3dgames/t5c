import { BrainSchema, LootSchema } from "../schema";
import { GameRoom } from "../GameRoom";
import { EntityState, Speed } from "../../../shared/types";
import { nanoid } from "nanoid";
import Logger from "../../utils/Logger";
import { randomNumberInRange } from "../../../shared/Utils";
import { GameRoomState } from "../state/GameRoomState";

export class spawnCTRL {
    private _state: GameRoomState;
    private _room: GameRoom;
    private _location;

    private spawnsAmount = [];

    constructor(state: GameRoomState) {
        this._state = state;
        this._room = state._gameroom;
        this._location = this._state.gameData.get("location", this._room.metadata.location);
        this.process();

        for (let i = 0; i < 100; i++) {
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
        spawns.forEach((spawnInfo, index) => {
            spawnInfo.spawnIndex = "_" + index;
            spawnInfo.index = index;
            if (!this.spawnsAmount[spawnInfo.spawnIndex]) {
                this.spawnsAmount[spawnInfo.spawnIndex] = 0;
            }
            this.spawn(spawnInfo);
        });
    }

    private spawn(e) {
        for (let i = 0; i < e.amount; i++) {
            if (this.spawnsAmount[e.spawnIndex] < e.amount) {
                this.createEntity(e);
            }
        }
    }

    public createItem(sender?) {
        // create drops
        let sessionId = nanoid(10);

        // monster pool to chose from
        let Items = this._state.gameData.load("items");
        let keys = Object.keys(Items);
        let rand = keys[Math.floor(Math.random() * keys.length)];
        let randData = Items[rand];

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
            y: currentPosition.y,
            z: currentPosition.z,
            qty: 1,
        };
        let entity = new LootSchema(this._state, data);
        this._state.entityCTRL.add(entity);

        //Logger.info("[gameroom][state][createEntity] created new item " + data.key + ": " + sessionId);
    }

    public createEntity(spawnInfo) {
        // random id
        let sessionId = nanoid(10);

        // monster pool to chose from
        let raceData = this._state.gameData.get("race", spawnInfo.race);
        let position = spawnInfo.points[Math.floor(Math.random() * spawnInfo.points.length)];

        let health = spawnInfo.baseHealth ?? raceData.baseHealth;
        let rotation = spawnInfo.rotation ?? randomNumberInRange(0, Math.PI);
        let speed = spawnInfo.baseSpeed ?? Speed.MEDIUM;

        // create entity
        let data = {
            sessionId: sessionId,
            type: "entity",
            race: raceData.key,
            material: spawnInfo.material,
            name: spawnInfo.name,
            location: this._room.metadata.location,
            x: position.x ?? 0,
            y: position.y ?? 0,
            z: position.z ?? 0,
            rot: rotation,
            health: health,
            mana: raceData.baseMana,
            maxHealth: health,
            maxMana: raceData.baseMana,
            speed: speed,
            level: 1,
            anim_state: EntityState.IDLE,
            toRegion: false,
            AI_SPAWN_INFO: spawnInfo,
            spawn_id: spawnInfo.index,
            initial_equipment: spawnInfo.equipment,
        };

        //
        this.spawnsAmount[spawnInfo.spawnIndex]++;

        // add to manager
        this._state.entityCTRL.add(new BrainSchema(this._state, data));

        // log
        //Logger.info("[gameroom][state][createEntity] created new entity " + raceData.key + ": " + sessionId, spawnInfo);
    }

    removeEntity(entity) {
        //console.log(this.spawnsAmount, entity.AI_SPAWN_INFO.spawnIndex);

        this.spawnsAmount[entity.AI_SPAWN_INFO.spawnIndex]--;

        this._state.entities.delete(entity.sessionId);
    }
}
