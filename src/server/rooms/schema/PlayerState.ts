import { Schema, MapSchema, type } from "@colyseus/schema";
import Config from "../../../shared/Config";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { EntityState } from "../schema/EntityState";
import { InventoryItem } from "../schema/InventoryItem";
import { GameRoom } from "../GameRoom";
import { abilitiesCTRL } from "../ctrl/abilityCTRL";
import { moveCTRL } from "../ctrl/moveCTRL";
import { dataDB } from "../../../shared/Data/dataDB";
import { Item } from "src/shared/Entities/Item";

export class PlayerState extends EntityState {
    // networked player specific
    @type("uint32") public gold: number = 0;
    @type("uint8") public strength: number = 0;
    @type("uint8") public endurance: number = 0;
    @type("uint8") public agility: number = 0;
    @type("uint8") public intelligence: number = 0;
    @type("uint8") public wisdom: number = 0;
    @type({ map: InventoryItem }) inventory = new MapSchema<InventoryItem>();

    //
    public gracePeriod: boolean = true;
    public attackTimer;
    public abilitiesCTRL: abilitiesCTRL;
    public moveCTRL: moveCTRL;

    public events = [];

    constructor(gameroom: GameRoom, data, ...args: any[]) {
        super(gameroom, data, args);

        Object.assign(this, data);
        Object.assign(this, dataDB.get("race", this.race));

        this.abilitiesCTRL = new abilitiesCTRL(this);
        this.moveCTRL = new moveCTRL(this);

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

    addItemToInventory(item: Item) {
        console.log("Pick up item", item.key);

        // drop item on the ground
        let data = {
            key: item.key,
            qty: 1,
        };

        let inventoryItem = this.inventory.get(data.key);
        if (inventoryItem) {
            inventoryItem.qty += 1;
        } else {
            this.inventory.set(item.key, new InventoryItem(data));
        }
    }

    setAsDead() {
        this.abilitiesCTRL.cancelAutoAttack(this);
        this.isDead = true;
        this.health = 0;
        this.blocked = true;
        this.state = EntityCurrentState.DEAD;
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
        this.state = EntityCurrentState.IDLE;
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
}
