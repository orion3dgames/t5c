import { Schema, type, MapSchema, filterChildren } from "@colyseus/schema";
import { Client } from "colyseus";
import { BrainSchema, Entity, EquipmentSchema, LootSchema, PlayerSchema } from "../schema";

import { PlayerInputs } from "../../../shared/types";
import { spawnCTRL } from "../controllers/spawnCTRL";
import { entityCTRL } from "../controllers/entityCTRL";

import { GameRoom } from "../GameRoom";
import { EntityState } from "../../../shared/Entities/Entity/EntityState";
import { NavMesh } from "../../../shared/yuka-min";

import { nanoid } from "nanoid";
import Logger from "../../../shared/Logger";
import { randomNumberInRange } from "../../../shared/Utils";
import { dataDB } from "../../../shared/Data/dataDB";

import { GetLoot, LootTableEntry } from "../../../shared/Entities/Player/LootTable";
import Config from "../../../shared/Config";
import { Item, ItemClass, PlayerSlots } from "../../../shared/Data/ItemDB";

export class GameRoomState extends Schema {
    // networked variables
    /*
    @filterChildren(function (client, key, value: BrainSchema | LootSchema | PlayerSchema, root) {
        const isSelf = value.sessionId === client.sessionId;
        const player = (this as GameRoomState).entityCTRL.get(client.sessionId);
        const isWithinXBounds = Math.abs(player.x - value.x) < Config.PLAYER_VIEW_DISTANCE;
        const isWithinZBounds = Math.abs(player.z - value.z) < Config.PLAYER_VIEW_DISTANCE;
        const isWithinBounds = isWithinXBounds && isWithinZBounds;
        return isSelf || isWithinBounds;
    })*/
    @type({ map: Entity }) entities = new MapSchema<BrainSchema | LootSchema | PlayerSchema>();

    @type("number") serverTime: number = 0.0;

    // not networked variables
    public _gameroom: GameRoom = null;
    public spawnCTRL: spawnCTRL;
    public navMesh: NavMesh = null;
    public entityCTRL: entityCTRL;
    private roomDetails;

    private spawnTimer = 0;
    private spawnInterval = 10000;

    constructor(gameroom: GameRoom, _navMesh: NavMesh, ...args: any[]) {
        super(...args);
        this._gameroom = gameroom;
        this.navMesh = _navMesh;
        this.roomDetails = dataDB.get("location", this._gameroom.metadata.location);

        this.entityCTRL = new entityCTRL(this);
        this.spawnCTRL = new spawnCTRL(this);
    }

    public update(deltaTime: number) {
        // updating entities
        this.entityCTRL.all.forEach((entity) => {
            entity.update(deltaTime);
        });

        // keep updating spawn points every 5 seconds
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnCTRL.update();
        }
    }

    getEntity(sessionId) {
        return this.entityCTRL.get(sessionId);
    }

    deleteEntity(sessionId) {
        this.entities.delete(sessionId);
    }

    removeTarget(sessionId) {
        this.entityCTRL.all.forEach((entity) => {
            if (entity.type === "entity" && entity.AI_TARGET && entity.AI_TARGET.sessionId === sessionId) {
                entity.AI_TARGET = null;
            }
        });
    }

    /**
     * Add player
     * @param client
     */
    addPlayer(client: Client): void {
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

            initial_player_data: player_data,
            initial_abilities: data.abilities ?? [],
            initial_inventory: data.inventory ?? [],
        };

        this.entityCTRL.add(new PlayerSchema(this, player));

        // set player as online
        this._gameroom.database.toggleOnlineStatus(client.auth.id, 1);

        // log
        Logger.info(`[gameroom][onJoin] player ${client.sessionId} joined room ${this._gameroom.roomId}.`);
    }

    processMessage(client, type, data) {
        ////////////////////////////////////
        ////////// SERVER EVENTS ///////////
        ////////////////////////////////////
        if (type === "ping") {
            client.send("pong", data);
        }

        ////////////////////////////////////
        ////////// PLAYER EVENTS ///////////
        ////////////////////////////////////
        const playerState: PlayerSchema = this.getEntity(client.sessionId) as PlayerSchema;
        if (!playerState) {
            return false;
        }

        /////////////////////////////////////
        // on player reset position
        if (type === "reset_position") {
            playerState.resetPosition();
        }

        /////////////////////////////////////
        // on player ressurect
        if (type === "revive_pressed") {
            playerState.ressurect();
        }

        /////////////////////////////////////
        // on player learn skill
        if (type === "learn_skill") {
            const ability = dataDB.get("ability", data);
            if (ability) {
                playerState.abilitiesCTRL.learnAbility(ability);
            }
        }

        /////////////////////////////////////
        // on player add stat point
        if (type === "add_stats_point") {
            if (playerState.player_data.points > 0) {
                playerState.player_data[data] += 1;
                playerState.player_data.points -= 1;
            }
        }

        /////////////////////////////////////
        // on player input
        if (type === "playerInput") {
            let playerInputs = data as PlayerInputs;
            playerState.moveCTRL.processPlayerInput(playerInputs);
        }

        /////////////////////////////////////
        // on player teleport
        if (type === "playerTeleport") {
            let location = data;

            // update player location in database
            let newLocation = dataDB.get("location", location);
            let updateObj = {
                location: newLocation.key,
                x: newLocation.spawnPoint.x,
                y: newLocation.spawnPoint.y,
                z: newLocation.spawnPoint.z,
                rot: 0,
            };
            this._gameroom.database.updateCharacter(client.auth.id, updateObj);

            // update player state on server
            playerState.setLocation(location);

            // inform client he cand now teleport to new zone
            client.send("playerTeleportConfirm", location);

            // log
            Logger.info(`[gameroom][playerTeleport] player teleported to ${location}`);
        }

        /////////////////////////////////////
        // on player ressurect
        if (type === "pickup_item") {
            const itemState = this.getEntity(data.sessionId);
            if (itemState) {
                playerState.setTarget(itemState);
            }
        }

        /////////////////////////////////////
        // on player equip
        // data will equal the inventory index of the clicked item
        if (type === "use_item") {
            const item = playerState.getInventoryItemByIndex(data);
            console.log("use_item", data, item);
            if (item) {
                if (item.class === ItemClass.CONSUMABLE) {
                    playerState.consumeItem(item);
                } else if (item.equippable) {
                    playerState.equipItem(item);
                }
            }
        }

        /////////////////////////////////////
        // on player unequip
        if (type === "unequip_item") {
            const item = dataDB.get("item", data);
            // does item exist in database
            if (item) {
                playerState.unequipItem(item.key, item.slot);
            }
        }

        /////////////////////////////////////
        // player entity_attack
        if (type === "entity_ability_key") {
            // get players involved
            let targetState = this.getEntity(data.targetId) as Entity;

            if (data.digit === 5) {
                this.spawnCTRL.createItem(playerState);
                return false;
            }

            if (data.digit === 6) {
                let key = "sword_01";
                if (playerState.equipment.size > 0) {
                    playerState.unequipItem(key, PlayerSlots.WEAPON);
                } else {
                    playerState.equipItem(key);
                }
                return false;
            }

            if (targetState) {
                playerState.abilitiesCTRL.processAbility(playerState, targetState, data);
            }

            Logger.info(`[gameroom][entity_ability_key] player action processed`, data);
        }
    }
}
