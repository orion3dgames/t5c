import { Client } from "@colyseus/core";
import { Schema, MapSchema, ArraySchema, type, filter } from "@colyseus/schema";
import { GameRoom } from "../GameRoom";
import { abilitiesCTRL } from "../controllers/abilityCTRL";
import { animationCTRL } from "../controllers/animationCTRL";
import { moveCTRL } from "../controllers/moveCTRL";
import { NavMesh, Vector3 } from "../../../shared/Libs/yuka-min";
import { InventorySchema, EquipmentSchema, AbilitySchema, LootSchema } from "../schema";
import { GameRoomState } from "../state/GameRoomState";
import { Entity } from "../schema/Entity";
import { EntityState, ItemClass, PlayerSlots, PlayerKeys, CalculationTypes } from "../../../shared/types";
import { nanoid } from "nanoid";
import { Database } from "../../Database";
import Logger from "../../utils/Logger";

export class PlayerData extends Schema {
    @type({ map: InventorySchema }) inventory = new MapSchema<InventorySchema>();
    @type({ map: AbilitySchema }) abilities = new MapSchema<AbilitySchema>();
    @type("uint32") public gold: number = 0;
    @type("uint8") public strength: number = 0;
    @type("uint8") public endurance: number = 0;
    @type("uint8") public agility: number = 0;
    @type("uint8") public intelligence: number = 0;
    @type("uint8") public wisdom: number = 0;
    @type("uint32") public experience: number = 0;
    @type("uint32") public points: number = 5;
}

export class PlayerSchema extends Entity {
    /////////////////////////////////////////////////////////////
    // the below will be synced to all the players
    @type("number") public x: number = 0;
    @type("number") public y: number = 0;
    @type("number") public z: number = 0;
    @type("number") public rot: number = 0;

    @type("int16") public health: number = 0;
    @type("int16") public maxHealth: number = 0;
    @type("int16") public mana: number = 0;
    @type("int16") public maxMana: number = 0;
    @type("uint8") public level: number = 0;

    @type("string") public name: string = "";
    @type("string") public type: string = "player";
    @type("string") public race: string = "male_knight";
    @type("int8") public material: number = 0;

    @type("string") public location: string = "";
    @type("number") public sequence: number = 0; // latest input sequence
    @type("boolean") public blocked: boolean = false; // if true, used to block player and to prevent movement
    @type("int8") public anim_state: EntityState = EntityState.IDLE;

    @type({ map: EquipmentSchema }) equipment = new MapSchema<EquipmentSchema>();

    ////////////////////////////////////////////////////////////////////////////
    // the below data only need to synchronized to the player it belongs too
    // player data
    @filter(function (this: PlayerSchema, client: Client) {
        return this.sessionId === client.sessionId;
    })
    @type(PlayerData)
    player_data: PlayerData = new PlayerData();

    /////////////////////////////////////////////////////////////
    // does not need to be synced
    public id: number = 0;
    public manaRegen: number = 0;
    public healthRegen: number = 0;
    public speed: number = 0;
    public experienceGain: number = 0;
    public gracePeriod: boolean = true;
    public attackTimer;
    public isMoving: boolean = false;
    public isDead: boolean = false;
    public isTeleporting: boolean = false;

    // controllers
    public _navMesh: NavMesh;
    public _state: GameRoomState;
    public client;
    public abilitiesCTRL: abilitiesCTRL;
    public moveCTRL: moveCTRL;
    public animationCTRL: animationCTRL;

    // TIMER
    public spawnTimer: number = 0;

    ////////////////////////////
    public AI_TARGET = null; // AI_TARGET will always represent an entity
    public AI_TARGET_POSITION = null;
    public AI_TARGET_DISTANCE = null;
    public AI_TARGET_WAYPOINTS = [];
    public AI_ABILITY = null;
    public AI_TARGET_FOUND = false;

    // inventory
    public INVENTORY_LENGTH = 25;

    constructor(state: GameRoomState, data) {
        super();
        //
        this._navMesh = state.navMesh;
        this._state = state;
        this.client = this.getClient();
        this.isTeleporting = false;

        // add player data
        // assign player data
        Object.assign(this, data);
        Object.assign(this, this._state.gameData.get("race", this.race));

        // add learned abilities
        data.initial_abilities.forEach((element) => {
            this.player_data.abilities.set(element.key, new AbilitySchema(element));
        });

        // add equipment
        data.initial_equipment.forEach((element) => {
            this.equipment.set(element.key, new EquipmentSchema(element));
        });

        // add inventory items
        let i = 0;
        data.initial_inventory.forEach((element) => {
            element.i = "" + i;
            this.player_data.inventory.set("" + i, new InventorySchema(element));
            i++;
        });

        // add default player data
        Object.entries(data.initial_player_data).forEach(([k, v]) => {
            this.player_data[k] = v;
        });

        // set controllers
        this.abilitiesCTRL = new abilitiesCTRL(this, data);
        this.moveCTRL = new moveCTRL(this);
        this.animationCTRL = new animationCTRL(this);

        //
        this.start();
    }

    // on player state initialized
    start() {
        // add a 5 second grace period where the player can not be targeted by the ennemies
        setTimeout(() => {
            this.gracePeriod = false;
        }, this._state.config.PLAYER_GRACE_PERIOD);
    }

    // runs on every server iteration
    update() {
        if (this.isMoving === true) {
            this.isMoving = false;
        }

        // always check if player is dead ??
        if (this.isEntityDead() && !this.isDead) {
            this.setAsDead();
        }

        // if not dead
        if (this.isDead === false) {
            // continuously gain mana
            if (this.mana < this.maxMana) {
                this.mana += this.manaRegen;
            }

            // continuously gain health
            if (this.health < this.maxHealth) {
                this.health += this.healthRegen;
            }

            // check
            let interactive = this._state.roomDetails.dynamic.interactive ?? [];
            if (interactive.length > 0) {
                let currentPos = this.getPosition();
                interactive.forEach((element) => {
                    let distanceTo = currentPos.distanceTo(element.from);
                    if (distanceTo < 2) {
                        if (element.type === "teleport") {
                            this.x = element.to_vector.x;
                            this.y = element.to_vector.y;
                            this.z = element.to_vector.z;
                        }

                        if (element.type == "zone_change" && this.isTeleporting === false) {
                            this.isTeleporting = true;

                            let client = this._state._gameroom.clients.getById(this.sessionId);

                            // update player location in database
                            this.location = element.to_map;
                            this.x = element.to_vector.x,
                            this.y = element.to_vector.y,
                            this.z = element.to_vector.z,
                            this.rot = 0,
                            this._state._gameroom.database.updateCharacter(this.id, this);

                            // inform client he cand now teleport to new zone
                            client.send("playerTeleportConfirm", element.to_map);
                        }
                    }
                });
            }

            // move player
            this.moveCTRL.update();
        }

    }

    public getClient() {
        return this._state._gameroom.clients.getById(this.sessionId);
    }

    save(db:Database){

        let client = this.getClient();
        let character = client.auth;

        db.updateCharacter(client.auth.id, this);

        // update player items
        if (this.player_data.inventory && this.player_data.inventory.size > 0) {
            db.saveItems(character.id, this.player_data.inventory);
        }

        // update player abilities
        if (this.player_data.abilities && this.player_data.abilities.size > 0) {
            db.saveAbilities(character.id, this.player_data.abilities);
        }

        // update player equipment
        if (this.equipment && this.equipment.size > 0) {
            db.saveEquipment(character.id, this.equipment);
        }

        Logger.info("[gameroom][onCreate] player " + this.name + " saved to database.");
    }

    getInventoryItem(value, key = "index"): InventorySchema {
        let found;
        this.player_data.inventory.forEach((el, k) => {
            if (key === "index" && k === value) {
                found = el;
            } else if (key === "key" && el.key === value) {
                found = el;
            }
        });
        return found;
    }
    getInventoryItemByIndex(value): InventorySchema {
        return this.player_data.inventory.get("" + value);
    }

    findNextAvailableInventorySlot() {
        if (this.player_data.inventory.size > 0) {
            for (let i = 0; i < this.INVENTORY_LENGTH; i++) {
                if (!this.player_data.inventory.get("" + i)) {
                    return "" + i;
                }
            }
        }
        return "0";
    }

    isEquipementSlotAvailable(slot) {
        let available = true;
        this.equipment.forEach((item) => {
            if (item.slot === slot) {
                available = false;
            }
        });
        return available;
    }

    dropItem(inventoryItem, dropAll = false) {
        let newQuantity = dropAll ? inventoryItem.qty : inventoryItem.qty - 1;
        let data = {
            key: inventoryItem.key,
            sessionId: nanoid(10),
            x: this.x,
            y: this.y,
            z: this.z,
            qty: newQuantity,
        };
        let entity = new LootSchema(this._state, data);
        this._state.entityCTRL.add(entity);

        if (dropAll) {
            this.player_data.inventory.delete("" + inventoryItem.i);
        } else {
            inventoryItem.qty -= 1;
        }

        console.log("dropItem", dropAll, newQuantity, inventoryItem.qty);
    }

    pickupItem(loot: LootSchema) {
        
        // play animation
        this.animationCTRL.playAnim(this, EntityState.PICKUP, ()=>{

            let data = {
                key: loot.key,
                qty: loot.qty,
                i: "" + 0,
            };

            //
            let item = this._state.gameData.get("item", loot.key);

            // is item already inventory
            let inventoryItem = this.getInventoryItem(loot.key, "key");

            // is item stackable
            if (item.stackable && inventoryItem) {
                // increnent stack
                inventoryItem.qty += data.qty;
            } else {
                // find next available index
                data.i = this.findNextAvailableInventorySlot();

                // add inventory item
                this.player_data.inventory.set("" + data.i, new InventorySchema(data));
            }

            // delete loot
            this._state.entities.delete(loot.sessionId);

            // stop chasing target
            this.AI_TARGET = null;

        });
    }

    consumeItem(item) {
        item.benefits.forEach((element) => {
            let key = element.key;
            if (CalculationTypes.ADD === element.type) {
                this[key] += element.amount;
            }
            if (CalculationTypes.REMOVE === element.type) {
                this[key] -= element.amount;
            }
        });

        this.normalizeStats();

        item.qty -= 1;
        if (item.qty < 1) {
            this.player_data.inventory.delete(item.i);
        }
    }

    equipItem(item) {
        if (item.class !== ItemClass.ARMOR && item.class !== ItemClass.WEAPON) {
            console.log("this item class cannot be equipped", item);
            return false;
        }

        // make sure item is equipable
        if (!item.equippable) {
            console.log("item cannot be equipped", item);
            return false;
        }

        let slot = item.equippable.slot;
        let key = item.key;

        if (item && item.qty > 0 && this.isEquipementSlotAvailable(slot) === true) {
            item.qty -= 1;
            if (item.qty < 1) {
                // remove item from inventory
                this.player_data.inventory.delete(item.i);
            }
            // equip
            this.equipment.set(key, new EquipmentSchema({ key: key, slot: slot }));
        }
    }

    unequipItem(key, slot) {
        // remove item from inventory
        this.equipment.delete(key);

        // equip
        this.pickupItem(
            new LootSchema(this._state, {
                key: key,
                qty: 1,
            })
        );
    }

    setAsDead() {
        this.AI_TARGET = null;
        this.abilitiesCTRL.cancelAutoAttack(this);
        this.isDead = true;
        this.health = 0;
        this.blocked = true;
        this.anim_state = EntityState.DEAD;
    }

    resetPosition() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.ressurect();
    }

    ressurect() {
        this.isDead = false;
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        this.blocked = false;
        this.anim_state = EntityState.IDLE;
        this.gracePeriod = true;
        setTimeout(() => {
            this.gracePeriod = false;
        }, this._state.config.PLAYER_GRACE_PERIOD);
    }

    /**
     * is entity dead (isDead is there to prevent setting a player as dead multiple time)
     * @returns true if health smaller than 0 and not already set as dead.
     */
    isEntityDead() {
        return this.health <= 0;
    }

    // make sure no value are out of range
    normalizeStats() {
        // health
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        }
        if (this.health < 0) {
            this.health = 0;
        }

        // mana
        if (this.mana > this.maxMana) {
            this.mana = this.maxMana;
        }
        if (this.mana < 0) {
            this.mana = 0;
        }
    }

    getPosition() {
        return new Vector3(this.x, this.y, this.z);
    }

    hasTarget() {
        return this.AI_TARGET ?? false;
    }

    setTarget(target) {
        this.AI_TARGET = target;
    }

    monitorTarget() {
        if (this.AI_TARGET !== null && this.AI_TARGET !== undefined) {
            let targetPos = this.AI_TARGET.getPosition();
            let entityPos = this.getPosition();
            let distanceBetween = entityPos.distanceTo(targetPos);
            this.AI_TARGET_POSITION = targetPos;
            this.AI_TARGET_DISTANCE = distanceBetween;
        }
    }
}
