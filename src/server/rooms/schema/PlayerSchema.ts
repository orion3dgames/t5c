import { Client } from "@colyseus/core";
import { Schema, MapSchema, type, filter } from "@colyseus/schema";
import { abilitiesCTRL } from "../controllers/abilityCTRL";
import { animationCTRL } from "../controllers/animationCTRL";
import { moveCTRL } from "../controllers/moveCTRL";
import { dynamicCTRL } from "../controllers/dynamicCTRL";
import { statsCTRL } from "../controllers/statsCTRL";
import { NavMesh, Vector3 } from "../../../shared/Libs/yuka-min";
import { InventorySchema, EquipmentSchema, AbilitySchema, LootSchema, BrainSchema, QuestSchema, HotbarSchema } from "../schema";
import { GameRoomState } from "../state/GameRoomState";
import { Entity } from "../schema/Entity";
import { EntityState, ItemClass, CalculationTypes } from "../../../shared/types";
import { nanoid } from "nanoid";
import { Database } from "../../Database";
import Logger from "../../utils/Logger";

export class PlayerData extends Schema {
    @type({ map: InventorySchema }) inventory = new MapSchema<InventorySchema>();
    @type({ map: AbilitySchema }) abilities = new MapSchema<AbilitySchema>();
    @type({ map: QuestSchema }) quests = new MapSchema<QuestSchema>();
    @type({ map: HotbarSchema }) hotbar = new MapSchema<HotbarSchema>();
    @type("uint32") public gold: number = 0;
    @type("uint8") public strength: number = 0;
    @type("uint8") public endurance: number = 0;
    @type("uint8") public agility: number = 0;
    @type("uint8") public intelligence: number = 0;
    @type("uint8") public wisdom: number = 0;
    @type("uint32") public experience: number = 0;
    @type("uint32") public points: number = 5;
    @type("uint32") public ac: number = 0;
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
    @type("string") public head: string = "Head_Base";
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
    public isInteracting;
    public interactingStep: number = 0;
    public interactingTarget: BrainSchema;

    // controllers
    public _navMesh: NavMesh;
    public _state: GameRoomState;
    public client;
    public abilitiesCTRL: abilitiesCTRL;
    public moveCTRL: moveCTRL;
    public animationCTRL: animationCTRL;
    public dynamicCTRL: dynamicCTRL;
    public statsCTRL: statsCTRL;

    // TIMER
    public spawnTimer: number = 0;
    public regenTimer: number = 5000;
    public regenTimerElapsed: number = 0;

    ////////////////////////////
    public AI_TARGET = null; // AI_TARGET will always represent an entity
    public AI_TARGET_POSITION = null;
    public AI_TARGET_DISTANCE = null;
    public AI_TARGET_WAYPOINTS = [];
    public AI_ABILITY = null;
    public AI_TARGET_FOUND = false;
    public AI_TARGET_ATTACK_SPOTS;

    // inventory
    public INVENTORY_LENGTH = 25;

    constructor(state: GameRoomState, data) {
        super();
        //
        this._navMesh = state.navMesh;
        this._state = state;
        this.client = this.getClient();
        this.isTeleporting = false;

        // add default race data
        Object.assign(this, this._state.gameData.get("race", data.race));

        // add spawn data
        Object.assign(this, data);

        // add default player data (from DB)
        Object.entries(data.initial_player_data).forEach(([k, v]) => {
            this.player_data[k] = v;
        });

        // initalize stats
        this.statsCTRL = new statsCTRL(this);

        // add abilities
        console.log(data.initial_abilities);
        data.initial_abilities.forEach((element) => {
            this.player_data.abilities.set(element.key, new AbilitySchema(element));
        });

        // add equipment
        data.initial_equipment.forEach((element) => {
            this.equipment.set(element.key, new EquipmentSchema(element, this));
        });

        // add quests
        data.initial_quests.forEach((element) => {
            this.player_data.quests.set(element.key, new QuestSchema(element));
        });

        // add hotbar
        data.initial_hotbar.forEach((element) => {
            this.player_data.hotbar.set(element.digit, new HotbarSchema(element));
        });

        // add inventory items
        let i = 0;
        data.initial_inventory.forEach((element) => {
            element.i = "" + i;
            this.player_data.inventory.set("" + i, new InventorySchema(element));
            i++;
        });

        // set controllers
        this.abilitiesCTRL = new abilitiesCTRL(this);
        this.moveCTRL = new moveCTRL(this);
        this.animationCTRL = new animationCTRL(this);
        this.dynamicCTRL = new dynamicCTRL(this);

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
        // always check if player is dead ??
        if (this.isEntityDead() && !this.isDead) {
            //this.setAsDead();
        }

        // if not dead
        if (this.isDead === true) {
            // if player is dead make sure player animation is EntityState.DEAD
            if (this.anim_state !== EntityState.DEAD) {
                this.anim_state = EntityState.DEAD;
            }
            return false;
        }

        // regen timer 5seconds
        this.regenTimerElapsed += this._state.config.updateRate;
        if (this.regenTimerElapsed >= this.regenTimer) {
            // continuously gain mana
            if (this.mana < this.maxMana) {
                this.mana += this.manaRegen;
            }
            // continuously gain health
            if (this.health < this.maxHealth) {
                this.health += this.healthRegen;
            }
            this.regenTimerElapsed = 0;
        }

        // update dynamic stuuf
        this.dynamicCTRL.update();

        // move player
        this.moveCTRL.update();
    }

    public getClient() {
        return this._state._gameroom.clients.getById(this.sessionId);
    }

    save(db: Database) {
        let client = this.getClient();
        let character = client.auth;

        // update character
        db.updateCharacter(client.auth.id, this);

        // update player items
        db.saveItems(character.id, this.player_data.inventory);

        // update player abilities
        db.saveAbilities(character.id, this.player_data.abilities);

        // update player equipment
        db.saveEquipment(character.id, this.equipment);

        // update player quests
        db.saveQuests(character.id, this.player_data.quests);

        // update player hotbar
        db.saveHotbar(character.id, this.player_data.hotbar);

        // log
        Logger.info("[gameroom][onCreate] player " + this.name + " saved to database.");
    }

    /**
     * Calculate rotation based on moving from v1 to v2
     * @param {Vector3} v1
     * @param {Vector3} v2
     * @returns rotation in radians
     */
    rotateTowards(v1: Vector3, v2: Vector3): number {
        return Math.atan2(v1.x - v2.x, v1.z - v2.z);
    }

    //////////////////////////////////////////////
    /////////////// HOTBAR ///////////////////////
    //////////////////////////////////////////////

    findNextAvailableHotbarSlot(): number | boolean {
        if (this.player_data.hotbar.size > 0) {
            for (let i = 1; i <= this._state.config.PLAYER_HOTBAR_SIZE; i++) {
                if (!this.player_data.hotbar.get("" + i)) {
                    return i;
                }
            }
            return false;
        }
        return 1;
    }

    //////////////////////////////////////////////
    /////////////// INVENTORY ////////////////////
    //////////////////////////////////////////////

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

    findNextAvailableInventorySlot(): string | boolean {
        if (this.player_data.inventory.size > 0) {
            for (let i = 0; i < this._state.config.PLAYER_INVENTORY_SPACE; i++) {
                if (!this.player_data.inventory.get("" + i)) {
                    return "" + i;
                }
            }
            return false;
        }
        return "" + 0;
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

    reduceItemQuantity(inventoryItem, amount = 1) {
        let quantity = inventoryItem.qty - amount;
        if (quantity < 1) {
            this.player_data.inventory.delete("" + inventoryItem.i);
        } else {
            inventoryItem.qty -= 1;
        }
    }

    increaseItemQuantity(inventoryItem, amount = 1) {
        inventoryItem.qty += amount;
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

    buyItem(item, qty) {
        let availableSlot = this.findNextAvailableInventorySlot();

        if (!availableSlot) {
            console.error("BUYING", item.key, "QTY: " + qty, "INVENTORY IS FULL (" + availableSlot + ")");
            return false;
        }

        console.log("BUYING", item.key, "QTY: " + qty, "INVENTORY SLOT: " + availableSlot);

        let loot = new LootSchema(this._state, {
            key: item.key,
            qty: qty,
        });
        this.pickupItem(loot);

        // remove gold from player
        this.player_data.gold = this.player_data.gold - item.value * qty;
    }

    sellItem(inventoryItem) {
        // reduce inventory qty
        this.reduceItemQuantity(inventoryItem, 1);

        // add gold to player
        this.player_data.gold += inventoryItem.value;

        console.log("SELLING", inventoryItem.key, "QTY: 1");
    }

    pickupItem(loot: LootSchema) {
        // play animation // disabled
        //this.animationCTRL.playAnim(this, EntityState.PICKUP, () => {});

        let availableSlot = this.findNextAvailableInventorySlot();

        if (!availableSlot) {
            console.error("PICK UP", loot.key, "QTY: " + loot.qty, "INVENTORY IS FULL (" + availableSlot + ")");
            return false;
        }

        let data = {
            key: loot.key,
            qty: loot.qty,
            i: "" + availableSlot,
        };

        console.log("PICK UP", loot.key, "QTY: " + loot.qty, "SLOT: " + availableSlot);

        //
        let item = this._state.gameData.get("item", loot.key);

        // is item already inventory
        let inventoryItem = this.getInventoryItem(loot.key, "key");

        // is item stackable
        if (item.stackable && inventoryItem) {
            // increnent quantity
            this.increaseItemQuantity(inventoryItem, data.qty);
        } else {
            // add inventory item
            this.player_data.inventory.set("" + data.i, new InventorySchema(data));
        }

        // delete loot
        if (this._state.entities.get(loot.sessionId)) {
            this._state.entities.delete(loot.sessionId);
        }

        // stop chasing target
        this.AI_TARGET = null;
    }

    consumeItem(item) {
        // process
        for (let stat in item.statModifiers) {
            item.statModifiers[stat].forEach((modifier) => {
                if (CalculationTypes.ADD === modifier.type) {
                    this[stat] += modifier.value;
                }
                if (CalculationTypes.REMOVE === modifier.type) {
                    this[stat] -= modifier.value;
                }
            });
        }

        // reduce item quantity
        this.reduceItemQuantity(item, 1);

        // make sure not stats are out of bounds
        this.normalizeStats();
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

        // if can equip
        if (this.canEquip(item, slot)) {
            // remove from inventory
            this.reduceItemQuantity(item, 1);

            // equip
            this.equipment.set(key, new EquipmentSchema({ key: key, slot: slot }, this));
        }
    }

    unequipItem(key, slot) {
        let availableSlot = this.findNextAvailableInventorySlot();

        if (!availableSlot) {
            console.error("UNEQUIP ITEM", key, "SLOT: " + slot, "INVENTORY IS FULL (" + availableSlot + ")");
            return false;
        }

        // remove item from equipment
        this.equipment.delete(key);

        //
        this.statsCTRL.unequipItem(this._state.gameData.get("item", key));

        // equip
        this.pickupItem(
            new LootSchema(this._state, {
                key: key,
                qty: 1,
            })
        );
    }

    canEquip(item, slot) {
        return item && item.qty > 0 && this.isEquipementSlotAvailable(slot) === true;
    }

    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////

    setAsDead() {
        this.AI_TARGET = null;
        this.AI_ABILITY = null;
        this.isDead = true;
        this.health = 0;
        this.blocked = true;
        this.anim_state = EntityState.DEAD;
        console.log("setAsDead", "SET AS DEAD", this.sessionId);
    }

    resetPosition() {
        this.x = 6.3;
        this.y = 0;
        this.z = -23.5;
        this.rot = 3.13;
        this.ressurect();
    }

    ressurect() {
        this.isDead = false;
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        this.blocked = false;
        this.gracePeriod = true;
        this.anim_state = EntityState.IDLE;
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
