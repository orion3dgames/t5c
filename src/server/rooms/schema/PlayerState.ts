import { Client } from "@colyseus/core";
import { Schema, MapSchema, type, filter, OPERATION } from "@colyseus/schema";
import Config from "../../../shared/Config";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { GameRoom } from "../GameRoom";
import { abilitiesCTRL } from "../ctrl/abilityCTRL";
import { moveCTRL } from "../ctrl/moveCTRL";
import { dataDB } from "../../../shared/Data/dataDB";
import { Item } from "src/shared/Entities/Item";
import { NavMesh, Vector3 } from "../../../shared/yuka";

import { InventoryItem } from "../schema/InventoryItem";
import { AbilityItem } from "./AbilityItem";
import { LootState } from "./LootState";

export class PlayerData extends Schema {
    @type({ map: InventoryItem }) inventory = new MapSchema<InventoryItem>();
    @type({ map: AbilityItem }) abilities = new MapSchema<AbilityItem>();
}

export class PlayerState extends Schema {
    /////////////////////////////////////////////////////////////
    // the below will be synced to all the players
    @type("number") public id: number = 0;
    @type("number") public x: number = 0;
    @type("number") public y: number = 0;
    @type("number") public z: number = 0;
    @type("number") public rot: number = 0;

    @type("int16") public health: number = 0;
    @type("int16") public maxHealth: number = 0;
    @type("int16") public mana: number = 0;
    @type("int16") public maxMana: number = 0;
    @type("uint8") public level: number = 0;

    @type("string") public sessionId: string;
    @type("string") public name: string = "";
    @type("string") public type: string = "player";
    @type("string") public race: string = "player_hobbit";

    @type("string") public location: string = "";
    @type("number") public sequence: number = 0; // latest input sequence
    @type("boolean") public blocked: boolean = false; // if true, used to block player and to prevent movement
    @type("int8") public anim_state: EntityCurrentState = EntityCurrentState.IDLE;

    // could be remove from state
    @type("uint32") public gold: number = 0;
    @type("uint8") public strength: number = 0;
    @type("uint8") public endurance: number = 0;
    @type("uint8") public agility: number = 0;
    @type("uint8") public intelligence: number = 0;
    @type("uint8") public wisdom: number = 0;
    @type("uint32") public experience: number = 0;

    // the below data only need to synchronized to the player it belongs too
    @filter(function (this: PlayerState, client: Client) {
        return this.sessionId === client.sessionId;
    })
    @type({ map: InventoryItem })
    inventory = new MapSchema<InventoryItem>();

    @filter(function (this: PlayerState, client: Client) {
        return this.sessionId === client.sessionId;
    })
    @type({ map: AbilityItem })
    abilities = new MapSchema<AbilityItem>();

    /////////////////////////////////////////////////////////////
    // does not need to be synced
    public manaRegen: number = 0;
    public healthRegen: number = 0;
    public speed: number = 0;
    public experienceGain: number = 0;
    public gracePeriod: boolean = true;
    public attackTimer;
    public isMoving: boolean = false;
    public isDead: boolean = false;

    // controllers
    public _navMesh: NavMesh;
    public _gameroom;
    public client;
    public abilitiesCTRL: abilitiesCTRL;
    public moveCTRL: moveCTRL;

    // AI variables
    public AI_CURRENT_TARGET_POSITION = null;
    public AI_CURRENT_TARGET_DISTANCE = 0;
    public AI_CURRENT_TARGET;
    public AI_CURRENT_ABILITY;

    constructor(gameroom: GameRoom, data) {
        super(gameroom, data);

        this._navMesh = gameroom.navMesh;
        this._gameroom = gameroom;
        this.client = this.getClient();

        // assign player data
        Object.assign(this, data);
        Object.assign(this, dataDB.get("race", this.race));

        // assign player data
        // todo: must be better way to do this
        data.default_abilities.forEach((element) => {
            this.abilities.set(element.key, new AbilityItem(element));
        });
        data.default_inventory.forEach((element) => {
            this.inventory.set(element.key, new InventoryItem(element));
        });

        // set controllers
        this.abilitiesCTRL = new abilitiesCTRL(this);
        this.moveCTRL = new moveCTRL(this);

        //
        this.start();
    }

    public getClient() {
        return this._gameroom.clients.get(this.sessionId);
    }

    // on player state initialized
    start() {
        // add a 5 second grace period where the player can not be targeted by the ennemies
        setTimeout(() => {
            this.gracePeriod = false;
        }, Config.PLAYER_GRACE_PERIOD);
    }

    // runs on every server iteration
    update() {
        this.isMoving = false;

        // always check if player is dead ??
        if (this.isEntityDead()) {
            this.setAsDead();
        } else if (this.isDead) {
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
        }

        //
        this.moveCTRL.update();
    }

    addItemToInventory(loot: LootState) {
        let data = {
            key: loot.key,
            qty: loot.quantity,
        };
        console.log("Pick up item", data);
        let inventoryItem = this.inventory.get(data.key);
        if (inventoryItem) {
            inventoryItem.qty += data.qty;
        } else {
            this.inventory.set(data.key, new InventoryItem(data));
        }
        this._gameroom.state.items.delete(loot.sessionId);
    }

    setAsDead() {
        this.abilitiesCTRL.cancelAutoAttack(this);
        this.isDead = true;
        this.health = 0;
        this.blocked = true;
        this.anim_state = EntityCurrentState.DEAD;
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
        this.anim_state = EntityCurrentState.IDLE;
        this.gracePeriod = true;
        setTimeout(() => {
            this.gracePeriod = false;
        }, Config.PLAYER_GRACE_PERIOD);
    }

    /**
     * is entity dead (isDead is there to prevent setting a player as dead multiple time)
     * @returns true if health smaller than 0 and not already set as dead.
     */
    isEntityDead() {
        return this.health <= 0 && this.isDead === false;
    }

    setLocation(location: string): void {
        this.location = location;
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

    setTarget(target) {
        this.AI_CURRENT_TARGET = target;
    }

    hasTarget() {
        return this.AI_CURRENT_TARGET ?? false;
    }

    /**
     * monitor a target
     */
    monitorTarget() {
        if (this.AI_CURRENT_TARGET !== null && this.AI_CURRENT_TARGET !== undefined && this.AI_CURRENT_TARGET.sessionId) {
            let targetPos = this.AI_CURRENT_TARGET.getPosition();
            let entityPos = this.getPosition();
            let distanceBetween = entityPos.distanceTo(targetPos);
            this.AI_CURRENT_TARGET_POSITION = targetPos;
            this.AI_CURRENT_TARGET_DISTANCE = distanceBetween;
        } else {
            // else entity has no target
            this.AI_CURRENT_TARGET = null;
            this.AI_CURRENT_TARGET_POSITION = null;
            this.AI_CURRENT_TARGET_DISTANCE = 0;
        }
    }
}
