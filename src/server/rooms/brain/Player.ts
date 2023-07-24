import { Client } from "@colyseus/core";
import { Schema, MapSchema, type, filter } from "@colyseus/schema";
import Config from "../../../shared/Config";
import { GameRoom } from "../GameRoom";
import { abilitiesCTRL } from "../controllers/abilityCTRL";
import { moveCTRL } from "../controllers/moveCTRL";
import { dataDB } from "../../../shared/Data/dataDB";
import { NavMesh, Vector3, Vehicle } from "../../../shared/yuka";

import { InventorySchema } from "../schema/InventorySchema";
import { AbilitySchema } from "../schema/AbilitySchema";
import { LootSchema } from "../schema/LootSchema";
import { EntityState } from "../../../shared/Entities/Entity/EntityState";
import { PlayerSchema } from "../schema/PlayerSchema";
import { GameRoomState } from "../state/GameRoomState";

class Player {
    /////
    public race;
    public type;
    public level;
    public sessionId;
    public name;
    public x;
    public y;
    public z;
    public rot;
    public anim_state;
    public health;
    public maxHealth;
    public mana;
    public maxMana;
    public blocked;
    public location;

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

    public abilities;
    public inventory;
    public player_data;

    // controllers
    public _navMesh: NavMesh;
    public _schema;
    public _state;
    public client;
    public abilitiesCTRL: abilitiesCTRL;
    public moveCTRL: moveCTRL;

    ////////////////////////////
    public AI_CURRENT_TARGET = null;
    public AI_CURRENT_TARGET_POSITION = null;
    public AI_CURRENT_TARGET_DISTANCE = null;

    constructor(state: GameRoomState, data) {
        //
        this._navMesh = state.navMesh;
        this._state = state;
        this.client = this.getClient();

        // add player data
        // assign player data
        Object.assign(this, data);
        Object.assign(this, dataDB.get("race", this.race));

        // initialize Colyseus Schema
        let schema = new PlayerSchema(this, data);
        this._state.entities.set(data.sessionId, schema);
        this._schema = schema;

        // set controllers
        this.abilitiesCTRL = new abilitiesCTRL(this);
        this.moveCTRL = new moveCTRL(this);

        //
        this.start();
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
        console.log("UPDATE");

        this.isMoving = false;

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
        }

        // move player
        this.moveCTRL.update();

        // update COLYSEUS schema
        this.sync();
    }

    // send updates to colyseus schema
    sync() {
        let update = {
            sessionId: this.sessionId,
            type: this.type,
            race: this.race,
            name: this.name,

            x: this.x,
            y: this.y,
            z: this.z,
            rot: this.rot,

            health: this.health,
            maxHealth: this.maxHealth,
            mana: this.mana,
            maxMana: this.maxMana,
            level: this.level,

            anim_state: this.anim_state,

            player_data: {
                gold: this.player_data.gold ?? 0,
                strength: this.player_data.strength ?? 0,
                endurance: this.player_data.endurance ?? 0,
                agility: this.player_data.agility ?? 0,
                intelligence: this.player_data.intelligence ?? 0,
                wisdom: this.player_data.wisdom ?? 0,
                experience: this.player_data.experience ?? 0,
                points: this.player_data.points ?? 0,
            },
        };
        for (const key in update) {
            // only update if they is a change
            if (update[key] !== this._schema[key]) {
                this._schema[key] = update[key];
            }
        }

        if (this.abilities && this.abilities.length > 0) {
            this.abilities.forEach((element) => {
                this.abilities.set(element.key, new AbilitySchema(element));
            });
        }

        if (data.default_inventory && data.default_inventory.length > 0) {
            data.default_inventory.forEach((element) => {
                this.inventory.set(element.key, new InventorySchema(element));
            });
        }

        if (data.default_player_data && data.default_player_data.length > 0) {
            Object.entries(data.default_player_data).forEach(([k, v]) => {
                this.player_data[k] = v;
            });
        }
    }

    public getClient() {
        return this._state._gameroom.clients.getById(this.sessionId);
    }

    addItemToInventory(loot: LootSchema) {
        let data = {
            key: loot.key,
            qty: loot.quantity,
        };
        console.log("Pick up item", data);
        let inventoryItem = this.inventory.get(data.key);
        if (inventoryItem) {
            inventoryItem.qty += data.qty;
        } else {
            this.inventory.set(data.key, new InventorySchema(data));
        }
        this._state.items.delete(loot.sessionId);
    }

    setAsDead() {
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
        }, Config.PLAYER_GRACE_PERIOD);
    }

    /**
     * is entity dead (isDead is there to prevent setting a player as dead multiple time)
     * @returns true if health smaller than 0 and not already set as dead.
     */
    isEntityDead() {
        return this.health <= 0;
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

export { Player };
