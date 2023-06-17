import { Client } from "@colyseus/core";
import { Schema, MapSchema, type, filter, OPERATION } from "@colyseus/schema";
import Config from "../../../shared/Config";
import { GameRoom } from "../GameRoom";
import { abilitiesCTRL } from "../controllers/abilityCTRL";
import { moveCTRL } from "../controllers/moveCTRL";
import { dataDB } from "../../../shared/Data/dataDB";
import { NavMesh, Vector3 } from "../../../shared/yuka";

import { InventorySchema } from "./InventorySchema";
import { AbilitySchema } from "./AbilitySchema";
import { LootSchema } from "./LootSchema";
import { EntityState } from "../../../shared/Entities/Entity/EntityState";
import { Item } from "../../../shared/Entities/Item";

export class PlayerData extends Schema {
    //@type({ map: InventoryItem }) inventory = new MapSchema<InventoryItem>();
    //@type({ map: AbilityItem }) abilities = new MapSchema<AbilityItem>();
    @type("uint32") public gold: number = 0;
    @type("uint8") public strength: number = 0;
    @type("uint8") public endurance: number = 0;
    @type("uint8") public agility: number = 0;
    @type("uint8") public intelligence: number = 0;
    @type("uint8") public wisdom: number = 0;
    @type("uint32") public experience: number = 0;
    @type("uint32") public points: number = 5;
}

export class PlayerSchema extends Schema {
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
    @type("int8") public anim_state: EntityState = EntityState.IDLE;

    // could be remove from state
    @type("uint32") public gold: number = 0;

    ////////////////////////////////////////////////////////////////////////////
    // the below data only need to synchronized to the player it belongs too
    // player data
    @filter(function (this: PlayerSchema, client: Client) {
        return this.sessionId === client.sessionId;
    })
    @type(PlayerData)
    player_data: PlayerData = new PlayerData();

    // inventory
    @filter(function (this: PlayerSchema, client: Client) {
        return this.sessionId === client.sessionId;
    })
    @type({ map: InventorySchema })
    inventory = new MapSchema<InventorySchema>();

    // abilities
    @filter(function (this: PlayerSchema, client: Client) {
        return this.sessionId === client.sessionId;
    })
    @type({ map: AbilitySchema })
    abilities = new MapSchema<AbilitySchema>();

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
    public AI_TARGET_POSITION = null;
    public AI_TARGET_DISTANCE = 0;
    public AI_TARGET;
    public AI_ABILITY;

    // load test ai
    public AI_MODE = false;
    public AI_NAV_TARGET = null;
    public AI_NAV_WAYPOINTS = [];

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
            this.abilities.set(element.key, new AbilitySchema(element));
        });
        data.default_inventory.forEach((element) => {
            this.inventory.set(element.key, new InventorySchema(element));
        });
        Object.entries(data.default_player_data).forEach(([k, v]) => {
            this.player_data[k] = v;
        });

        // set controllers
        this.abilitiesCTRL = new abilitiesCTRL(this);
        this.moveCTRL = new moveCTRL(this);

        //
        this.start();
    }

    public getClient() {
        return this._gameroom.clients.getById(this.sessionId);
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

        //
        this.moveCTRL.update();

        // load test AI mode
        if (this.AI_MODE === true) {
            this.AI_Mode();
        }
    }

    public set_AI_mode() {
        this.AI_MODE = true;
    }

    public AI_Mode() {
        // save current position
        let currentPos = this.getPosition();

        if (this.AI_NAV_TARGET === null || this.AI_NAV_WAYPOINTS.length === 0) {
            this.AI_NAV_TARGET = this._gameroom.navMesh.getRandomRegion();
            this.AI_NAV_WAYPOINTS = this._gameroom.navMesh.findPath(currentPos, this.AI_NAV_TARGET.centroid);
        }

        // move entity
        if (this.AI_NAV_WAYPOINTS.length > 0) {
            // get next waypoint
            let destinationOnPath = this.AI_NAV_WAYPOINTS[0];
            destinationOnPath.y = 0;

            // calculate next position towards destination
            let updatedPos = this.moveCTRL.moveTo(currentPos, destinationOnPath, this.speed);
            this.moveCTRL.setPosition(updatedPos);

            // calculate rotation
            this.rot = this.moveCTRL.calculateRotation(currentPos, updatedPos);

            // check if arrived at waypoint
            if (destinationOnPath.equals(updatedPos)) {
                this.AI_NAV_WAYPOINTS.shift();
            }
        } else {
            // something is wrong, let's look for a new destination
            this.AI_NAV_TARGET = null;
            this.AI_NAV_WAYPOINTS = [];
        }
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
        this._gameroom.state.items.delete(loot.sessionId);
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

    setTarget(target) {
        this.AI_TARGET = target;
    }

    hasTarget() {
        return this.AI_TARGET ?? false;
    }

    /**
     * monitor a target
     */
    monitorTarget() {
        if (this.AI_TARGET !== null && this.AI_TARGET !== undefined) {
            let targetPos = this.AI_TARGET.getPosition();
            let entityPos = this.getPosition();
            let distanceBetween = entityPos.distanceTo(targetPos);
            this.AI_TARGET_DISTANCE = distanceBetween;
        }
    }
}
