import { BrainSchema, LootSchema } from "../schema";
import { GameRoom } from "../GameRoom";
import { EntityState, Speed } from "../../../shared/types";
import { nanoid } from "nanoid";
import Logger from "../../utils/Logger";
import { randomNumberInRange } from "../../../shared/Utils";
import { GameRoomState } from "../state/GameRoomState";
import { Vector3 } from "../../../shared/Libs/yuka-min";

export class spawnCTRL {
    private _state: GameRoomState;
    private _room: GameRoom;
    public location;
    private spawnsAmount = [];
    private SPAWN_RATE = 10;
    private SPAWN_INTERVAL = 300;
    private SPAWN_CURRENT = 0;

    constructor(state: GameRoomState) {
        this._state = state;
        this._room = state._gameroom;
        this.location = this._state.gameData.get("location", this._room.metadata.location);

        // add fake item for testing purposes
        if (this.location.key === "lh_town") {
            // add items to the ground
            for (let i = 0; i < 400; i++) {
                //this.createItem();
            }
        }

        //
        this.process();
    }

    public debug_bots() {
        // added npc's
        let Items = this._state.gameData.load("items");
        let keys = Object.keys(Items);
        let heads = [
            "Head_Base", //
            "Head_Barbarian",
            "Head_Engineer",
            "Head_Mage",
            "Head_Rogue",
            "Head_Paladin",
        ];
        let race = this._state.gameData.get("race", "humanoid");
        for (let i = 0; i < 100; i++) {
            let rand = keys[Math.floor(Math.random() * keys.length)];
            let randData = Items[rand];
            let equipment = [];
            if (randData.equippable) {
                equipment.push({
                    key: randData.key,
                    slot: randData.equippable.slot,
                }) as any;
            }

            this.location.dynamic.spawns.push({
                key: "spawn_dummy_" + i,
                type: "area",
                behaviour: "patrol",
                aggressive: false,
                canAttack: true,
                points: [
                    new Vector3(9, 0, -13.7),
                    new Vector3(10.65, 0.06, -21.49),
                    new Vector3(-15.87, 0.06, -10.12),
                    new Vector3(16.44, 0.06, 2.11),
                    new Vector3(29.8, 0.06, -4.25),
                    new Vector3(25.34, 0.06, 28.82),
                    new Vector3(39.12, 0.06, -13.92),
                    new Vector3(-10.94, 0.06, -25.08),
                ],
                rotation: 3.12,
                radius: 0,
                amount: 1,
                race: race.key,
                material: randomNumberInRange(0, 23),
                head: heads[Math.floor(Math.random() * heads.length)],
                name: "Bot " + i,
                baseHealth: 5000,
                baseSpeed: Speed.VERY_SLOW,
                equipment: equipment,
            });
        }
    }

    public debug_increase(amount) {
        if (this.location.dynamic.spawns[0]) {
            this.location.dynamic.spawns[0].amount += amount;
        }
        if (this.location.dynamic.spawns[1]) {
            this.location.dynamic.spawns[1].amount += amount;
        }
    }

    public debug_decrease(amount) {
        if (this.location.dynamic.spawns[0] && this.location.dynamic.spawns[0] > amount - 1) {
            this.location.dynamic.spawns[0].amount -= amount;
        }
        if (this.location.dynamic.spawns[1] && this.location.dynamic.spawns[1] > amount - 1) {
            this.location.dynamic.spawns[1].amount -= amount;
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
        //Logger.info("[gameroom][state][spawning] process: " + this.location.key, this.spawnsAmount);
        let dynamic = this.location.dynamic;
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
            name: randData.title,
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

        // replace default stats
        let health = spawn.baseHealth ?? raceData.baseHealth;
        let mana = spawn.baseMana ?? raceData.baseMana;
        let rotation = spawn.rotation ?? randomNumberInRange(0, Math.PI);
        let speed = spawn.baseSpeed ?? Speed.MEDIUM;
        let head = spawn.head ?? "Head_Base";
        let material = spawn.material ?? 0;
        let experienceGain = spawn.experienceGain ?? 0;

        // if randomize
        if (spawn.randomize) {
            let heads = raceData.vat.meshes.head ?? [];
            material = randomNumberInRange(0, 23);
            if (heads.length > 0) {
                head = heads[Math.floor(Math.random() * heads.length)];
            }
        }

        // create entity
        let data = {
            sessionId: sessionId,
            type: "entity",
            race: raceData.key,
            material: material,
            head: head,
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
            spawn_key: spawn.key,
            experienceGain: experienceGain,
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
        if (entity.AI_SPAWN_INFO) {
            this.spawnsAmount[entity.AI_SPAWN_INFO.key]--;
        }
        this._state.entities.delete(entity.sessionId);
    }
}
