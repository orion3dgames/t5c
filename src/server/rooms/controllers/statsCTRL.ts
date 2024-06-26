import { Item } from "../../../shared/types";

type Modifier = {
    type: "additive" | "multiplicative";
    value: number;
};

export class Stat {
    baseValue: number;
    additiveModifiers: Modifier[];
    multiplicativeModifiers: Modifier[];

    constructor(baseValue: number = 0) {
        this.baseValue = baseValue;
        this.additiveModifiers = [];
        this.multiplicativeModifiers = [];
    }

    get value(): number {
        let additiveSum = this.additiveModifiers.reduce((sum, mod) => sum + mod.value, 0);
        let additiveValue = this.baseValue + additiveSum;

        let multiplicativeProduct = this.multiplicativeModifiers.reduce((product, mod) => product * mod.value, 1);
        return additiveValue * multiplicativeProduct;
    }

    addModifier(modifier: Modifier): void {
        if (modifier.type === "additive") {
            this.additiveModifiers.push(modifier);
        } else if (modifier.type === "multiplicative") {
            this.multiplicativeModifiers.push(modifier);
        }
    }

    removeModifier(modifier: Modifier): void {
        if (modifier.type === "additive") {
            this.additiveModifiers = this.additiveModifiers.filter((mod) => mod !== modifier);
        } else if (modifier.type === "multiplicative") {
            this.multiplicativeModifiers = this.multiplicativeModifiers.filter((mod) => mod !== modifier);
        }
    }

    clearModifiers(): void {
        this.additiveModifiers = [];
        this.multiplicativeModifiers = [];
    }
}
export class statsCTRL {
    private stats;
    private entity;

    onStatsChange: (stats: { [key: string]: number }) => void;

    constructor(entity) {
        // set base stats
        this.stats = {
            health: new Stat(entity.health),
            maxHealth: new Stat(entity.maxHealth),
            mana: new Stat(entity.mana),
            maxMana: new Stat(entity.maxMana),
            strength: new Stat(entity.player_data ? entity.player_data.strength : 0),
            agility: new Stat(entity.player_data ? entity.player_data.agility : 0),
            endurance: new Stat(entity.player_data ? entity.player_data.endurance : 0),
            intelligence: new Stat(entity.player_data ? entity.player_data.intelligence : 0),
            wisdom: new Stat(entity.player_data ? entity.player_data.wisdom : 0),
        };

        this.entity = entity;

        // whenever a stat is modified, update entity with the latest
        this.onStatsChange = (stats) => {
            console.log("onStatsChange", stats);
            this.entity.health = this.stats.health.value;
            this.entity.maxHealth = this.stats.maxHealth.value;
            this.entity.mana = this.stats.mana.value;
            this.entity.maxMana = this.stats.maxMana.value;
            this.entity.player_data.strength = this.stats.strength.value;
            this.entity.player_data.agility = this.stats.agility.value;
            this.entity.player_data.endurance = this.stats.endurance.value;
            this.entity.player_data.intelligence = this.stats.intelligence.value;
            this.entity.player_data.wisdom = this.stats.wisdom.value;
        };
    }

    equipItem(item: Item): void {
        this.applyItemModifiers(item, true);
        this.updateStats();
    }

    unequipItem(item): void {
        if (item) {
            this.applyItemModifiers(item, false);
            this.updateStats();
        }
    }

    applyItemModifiers(item: Item, apply: boolean): void {
        for (let stat in item.statModifiers) {
            if (this.stats[stat]) {
                item.statModifiers[stat].forEach((modifier) => {
                    if (apply) {
                        this.stats[stat].addModifier(modifier);
                    } else {
                        this.stats[stat].removeModifier(modifier);
                    }
                });
            }
        }
    }

    updateStats(): void {
        // Ensure health and mana do not exceed their max values
        if (this.stats.health.value > this.stats.maxHealth.value) {
            this.stats.health.baseValue = this.stats.maxHealth.value;
        }
        if (this.stats.mana.value > this.stats.maxMana.value) {
            this.stats.mana.baseValue = this.stats.maxMana.value;
        }
        // Trigger stats change callback
        this.onStatsChange(this.currentStats);
    }

    updateBaseStats(newBaseStats: { [key: string]: number }): void {
        for (let stat in newBaseStats) {
            if (this.stats[stat]) {
                this.stats[stat].baseValue = newBaseStats[stat];
            }
        }
        this.updateStats();
    }

    get currentStats(): { [key: string]: number } {
        const stats: { [key: string]: number } = {};
        for (let stat in this.stats) {
            stats[stat] = this.stats[stat].value;
        }
        return stats;
    }
}
