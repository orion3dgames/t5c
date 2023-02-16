import { type } from "@colyseus/schema";
import Config from "../../../shared/Config";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { EntityState } from "../schema/EntityState";
import { GameRoom } from "../GameRoom";
import { abilitiesCTRL } from "../ctrl/abilityCTRL";
import { moveCTRL } from "../ctrl/moveCTRL";

export class PlayerState extends EntityState {
    // networked player specific
    @type("number") public strength: number = 0;
    @type("number") public endurance: number = 0;
    @type("number") public agility: number = 0;
    @type("number") public intelligence: number = 0;
    @type("number") public wisdom: number = 0;

    //
    public gracePeriod: boolean = true;
    public attackTimer;
    public abilitiesCTRL: abilitiesCTRL;
    public moveCTRL: moveCTRL;

    public events = [];

    constructor(gameroom: GameRoom, data, ...args: any[]) {
        super(gameroom, data, args);

        //
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

        this.moveCTRL.update();
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
        this.health = 100;
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
