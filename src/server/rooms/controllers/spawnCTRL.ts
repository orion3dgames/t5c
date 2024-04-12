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

    private SPAWN_RATE = 10;
    private SPAWN_INTERVAL = 500;
    private SPAWN_CURRENT = 0;

    private DESPAWN = false;

    constructor(state: GameRoomState) {
        this._state = state;
        this._room = state._gameroom;
        this._location = this._state.gameData.get("location", this._room.metadata.location);
        this.process();

        for (let i = 0; i < 20; i++) {
            this.createItem();
        }
    }

    public update(delta) {
        this.SPAWN_CURRENT += delta;

        // spawn every SPAWN_INTERVAL
        if (this.SPAWN_CURRENT >= this.SPAWN_INTERVAL) {
            this.process();
            this.SPAWN_CURRENT = 0;
        }
    }

    public process() {
        //Logger.info("[gameroom][state][spawning] spawnController: " + this._location.key);
        let dynamic = this._location.dynamic;
        let spawns = dynamic.spawns ?? [];
        spawns.forEach((spawn, index) => {
            // needed later to find spawn details on client???
            // todo: improve
            spawn.index = index;

            // if first spawn, set amount to zero
            if (!this.spawnsAmount[spawn.key]) {
                this.spawnsAmount[spawn.key] = 0;
            }

            // only spawn if more are needed
            if (this.spawnsAmount[spawn.key] < spawn.amount) {
                this.spawn(spawn);
            }
        });
    }

    private spawn(spawn) {
        for (let i = 0; i < this.SPAWN_RATE; i++) {
            if (this.spawnsAmount[spawn.key] < spawn.amount) {
                this.createEntity(spawn);
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

    public createEntity(spawn) {
        // random id
        let sessionId = nanoid(10);

        // monster pool to chose from
        let raceData = this._state.gameData.get("race", spawn.race);
        let position = spawn.points[Math.floor(Math.random() * spawn.points.length)];
        console.log(position);

        let health = spawn.baseHealth ?? raceData.baseHealth;
        let mana = spawn.baseMana ?? raceData.baseMana;
        let rotation = spawn.rotation ?? randomNumberInRange(0, Math.PI);
        let speed = spawn.baseSpeed ?? Speed.MEDIUM;

        // create entity
        let data = {
            sessionId: sessionId,
            type: "entity",
            race: raceData.key,
            material: spawn.material,
            name: spawn.name,
            location: this._room.metadata.location,
            x: position.x ?? 0,
            y: position.y ?? 0,
            z: position.z ?? 0,
            rot: rotation,
            health: health,
            mana: raceData.baseMana,
            maxHealth: health,
            maxMana: 100,
            speed: speed,
            level: 1,
            anim_state: EntityState.IDLE,
            toRegion: false,
            AI_SPAWN_INFO: spawn,
            spawn_id: spawn.index,
            initial_equipment: spawn.equipment,
        };

        //
        this.spawnsAmount[spawn.key]++;

        // add to manager
        this._state.entityCTRL.add(new BrainSchema(this._state, data));

        // log
        Logger.info("[gameroom][state][createEntity] created new entity " + raceData.key + ": " + sessionId + ":" + mana);
    }

    removeEntity(entity) {
        //console.log(this.spawnsAmount, entity.AI_SPAWN_INFO.spawnIndex);

        this.spawnsAmount[entity.AI_SPAWN_INFO.spawnIndex]--;

        this._state.entities.delete(entity.sessionId);
    }
}
