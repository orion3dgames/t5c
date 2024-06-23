import { CalculationTypes } from "../types";
import { Stat } from "./Stat";

export class Stats {
    private health;
    private maxHealth;

    private mana;
    private maxMana;

    private strength;
    private agility;
    private endurance;
    private intelligence;
    private wisdom;

    private entity;

    private modifiers = [];

    constructor(entity) {
        //
        this.entity = entity;

        // set base stats
        this.setBasetStats();
    }

    addItemModifier(item) {
        if (item.benefits && item.benefits.length > 0) {
            item.benefits.forEach((benefit) => {
                this.modifiers.push(benefit);
            });
        }
    }

    setBasetStats() {
        // set base stats
        this.health = new Stat(this.entity.health);
        this.maxHealth = new Stat(this.entity.maxHealth);
        this.mana = new Stat(this.entity.mana);
        this.maxMana = new Stat(this.entity.maxMana);
        if (this.entity.player_data) {
            this.strength = new Stat(this.entity.player_data.strength);
            this.agility = new Stat(this.entity.player_data.agility);
            this.endurance = new Stat(this.entity.player_data.endurance);
            this.intelligence = new Stat(this.entity.player_data.intelligence);
            this.wisdom = new Stat(this.entity.player_data.wisdom);
        }
        console.log("[STATS] set base stats", this);
    }

    update() {
        this.modifiers.forEach((modifier) => {
            this[modifier.key].set(modifier.amount, modifier.type);
        });
    }
}
