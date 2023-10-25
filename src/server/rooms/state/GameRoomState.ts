import { Client } from "colyseus";
import { Schema, type, MapSchema, filterChildren } from "@colyseus/schema";
import { BrainSchema, Entity, EquipmentSchema, LootSchema, PlayerSchema } from "../schema";

import { spawnCTRL } from "../controllers/spawnCTRL";
import { entityCTRL } from "../controllers/entityCTRL";
import { gameDataCTRL } from "../controllers/gameDataCTRL";

import { GameRoom } from "../GameRoom";

import { NavMesh, Vector3 } from "../../../shared/Libs/yuka-min";
import Logger from "../../utils/Logger";
import { ItemClass, ServerMsg, Speed } from "../../../shared/types";

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
    public gameData: gameDataCTRL;

    public config;
    public roomDetails;

    private spawnTimer = 0;
    private spawnInterval = 60000;

    constructor(gameroom: GameRoom, _navMesh: NavMesh, ...args: any[]) {
        super(...args);
        this._gameroom = gameroom;
        this.config = gameroom.config;
        this.navMesh = _navMesh;

        this.start();
    }

    public async start() {
        // load game data
        // in the future, it'll be in the database
        this.gameData = new gameDataCTRL();
        await this.gameData.initialize();

        this.roomDetails = this.gameData.get("location", this._gameroom.metadata.location);

        // load controllers
        this.entityCTRL = new entityCTRL(this);
        this.spawnCTRL = new spawnCTRL(this);
    }

    public update(deltaTime: number) {
        // updating entities
        if (this.entityCTRL.hasEntities()) {
            this.entityCTRL.all.forEach((entity) => {
                entity.update(deltaTime);

                // remove loot that's been on the ground over 5 minutes
                if (entity.type === "item" && entity.spawnTimer > 1000 * 60 * 5) {
                    //this.deleteEntity(entity.sessionId);
                }
            });
        }

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
            strength: data.strength ?? 0,
            endurance: data.endurance ?? 0,
            agility: data.agility ?? 0,
            intelligence: data.intelligence ?? 0,
            wisdom: data.wisdom ?? 0,
            experience: data.experience ?? 0,
            gold: data.gold ?? 0,
            points: data.points ?? 0,
        };

        let player = {
            id: data.id,

            x: data.x ?? 0,
            y: data.y ?? 0,
            z: data.z ?? 0,
            rot: data.rot ?? 0,

            health: data.health,
            maxHealth: data.health,
            mana: data.mana,
            maxMana: data.mana,
            level: data.level,
            speed: Speed.MEDIUM,

            sessionId: client.sessionId,
            name: data.name,
            type: "player",
            race: data.race,
            material: data.material,

            location: data.location,
            sequence: 0,
            blocked: false,

            initial_player_data: player_data,
            initial_abilities: data.abilities ?? [],
            initial_inventory: data.inventory ?? [],
            initial_equipment: data.equipment ?? [],
            initial_quests: data.quests ?? [],
            initial_hotbar: data.hotbar ?? [],
        };

        console.log(player);

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

        if (type === ServerMsg.PING) {
            client.send(ServerMsg.PONG, data);
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
        if (type === ServerMsg.PLAYER_RESET_POSITION) {
            playerState.resetPosition();
        }

        /////////////////////////////////////
        // on player ressurect
        if (type === ServerMsg.PLAYER_RESSURECT) {
            playerState.ressurect();
        }

        /////////////////////////////////////
        // on player learn skill
        if (type === ServerMsg.PLAYER_LEARN_SKILL) {
            const ability = this.gameData.get("ability", data);
            if (ability) {
                playerState.abilitiesCTRL.learnAbility(ability);
            }
        }

        /////////////////////////////////////
        // on player add stat point
        if (type === ServerMsg.PLAYER_ADD_STAT_POINT) {
            if (playerState.player_data.points > 0) {
                playerState.player_data[data] += 1;
                playerState.player_data.points -= 1;
            }
        }

        /////////////////////////////////////
        // on player input
        if (type === ServerMsg.PLAYER_MOVE) {
            let playerInputs = data;
            playerState.moveCTRL.processPlayerInput(playerInputs);
        }
        if (type === ServerMsg.PLAYER_MOVE_TO) {
            playerState.abilitiesCTRL.cancelAutoAttack(playerState);
            playerState.moveCTRL.setTargetDestination(new Vector3(data.x, data.y, data.z));
        }

        /////////////////////////////////////
        // on player ressurect
        if (type === ServerMsg.PLAYER_PICKUP) {
            playerState.abilitiesCTRL.cancelAutoAttack(playerState);
            const itemState = this.getEntity(data);
            if (itemState) {
                playerState.setTarget(itemState);
            }
        }

        if (type === ServerMsg.PLAYER_DROP_ITEM) {
            let slot = data.slot;
            let dropAll = data.drop_all ?? false;
            const item = playerState.getInventoryItemByIndex(slot);

            if (item) {
                playerState.dropItem(item, dropAll);
            }
        }

        if (type === ServerMsg.PLAYER_BUY_ITEM) {
            const item = this.gameData.get("item", data.key);
            if (item) {
                playerState.buyItem(item, data.qty);
            }
        }

        if (type === ServerMsg.PLAYER_SELL_ITEM) {
            const item = playerState.getInventoryItemByIndex(data);
            if (item) {
                playerState.sellItem(item);
            }
        }

        /////////////////////////////////////
        // on player equip
        // data will equal the inventory index of the clicked item
        if (type === ServerMsg.PLAYER_USE_ITEM) {
            const item = playerState.getInventoryItemByIndex(data);
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
        if (type === ServerMsg.PLAYER_UNEQUIP_ITEM) {
            const item = this.gameData.get("item", data);
            // does item exist in database
            if (item) {
                playerState.unequipItem(item.key, item.slot);
            }
        }

        /////////////////////////////////////
        // on player unequip
        if (type === ServerMsg.PLAYER_QUEST_UPDATE) {
            playerState.dynamicCTRL.questUpdate(data);
        }

        /////////////////////////////////////
        // player entity_attack
        if (type === ServerMsg.PLAYER_HOTBAR_ACTIVATED) {
            // get players involved
            let targetState = this.getEntity(data.targetId) as Entity;
            let hotbarData = playerState.player_data.hotbar.get("" + data.digit);

            if (!hotbarData) {
                //console.error("hotbarData is invalid", data, playerState.player_data.hotbar);
                return false;
            }

            if (data.digit === 5) {
                this.spawnCTRL.createItem(playerState);
                return false;
            }

            // if item
            if (hotbarData && hotbarData.type === "item") {
                const item = playerState.getInventoryItem(hotbarData.key, "key");
                if (item && item.class === ItemClass.CONSUMABLE) {
                    playerState.consumeItem(item);
                }
                return false;
            }

            // if ability
            if (targetState && hotbarData && hotbarData.type === "ability") {
                console.error("PLAYER_HOTBAR_ACTIVATED", hotbarData.key);
                playerState.abilitiesCTRL.processAbility(playerState, targetState, data);
                return false;
            }

            Logger.info(`[gameroom][entity_ability_key] player action processed`, data);
        }
    }
}
