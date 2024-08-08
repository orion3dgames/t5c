import { CalculationTypes, Item } from "../../../shared/types";

type Modifier = {
    type: CalculationTypes;
    value: number;
};

type StatModifiers = {
    [key: string]: Modifier[];
};

class Buff {
    name: string;
    statModifiers: StatModifiers;
    duration: number; // Duration in seconds, 0 for permanent buffs/debuffs

    constructor(name: string, statModifiers: StatModifiers, duration: number = 0) {
        this.name = name;
        this.statModifiers = statModifiers;
        this.duration = duration;
    }
}

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
        if (modifier.type === CalculationTypes.ADD) {
            this.additiveModifiers.push(modifier);
        } else if (modifier.type === CalculationTypes.MULTIPLY) {
            this.multiplicativeModifiers.push(modifier);
        }
    }

    removeModifier(modifier: Modifier): void {
        if (modifier.type === CalculationTypes.ADD) {
            this.additiveModifiers = this.additiveModifiers.filter((mod) => mod !== modifier);
        } else if (modifier.type === CalculationTypes.MULTIPLY) {
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

    private equippedItems: Item[] = [];
    private activeBuffs: Buff[] = [];

    onStatsChange: (stats: { [key: string]: number }) => void;

    constructor(entity) {
        // set base stats
        this.stats = {
            //health: new Stat(entity.health),
            maxHealth: new Stat(entity.maxHealth),
            //mana: new Stat(entity.mana),
            maxMana: new Stat(entity.maxMana),
            strength: new Stat(entity.player_data ? entity.player_data.strength : 0),
            agility: new Stat(entity.player_data ? entity.player_data.agility : 0),
            endurance: new Stat(entity.player_data ? entity.player_data.endurance : 0),
            intelligence: new Stat(entity.player_data ? entity.player_data.intelligence : 0),
            wisdom: new Stat(entity.player_data ? entity.player_data.wisdom : 0),
            ac: new Stat(entity.player_data ? entity.player_data.ac : 0),
        };

        this.entity = entity;

        // whenever a stat is modified, update entity with the latest
        this.onStatsChange = (stats) => {
            //console.log("onStatsChange", stats);
            //this.entity.health = this.stats.health.value;
            this.entity.maxHealth = this.stats.maxHealth.value;
            //this.entity.mana = this.stats.mana.value;
            this.entity.maxMana = this.stats.maxMana.value;
            this.entity.player_data.strength = this.stats.strength.value;
            this.entity.player_data.agility = this.stats.agility.value;
            this.entity.player_data.endurance = this.stats.endurance.value;
            this.entity.player_data.intelligence = this.stats.intelligence.value;
            this.entity.player_data.wisdom = this.stats.wisdom.value;
            this.entity.player_data.ac = this.stats.ac.value;

            // make sure health is bigger than max health
            if (this.entity.health > this.entity.maxHealth) {
                this.entity.health = this.entity.maxHealth;
            }

            // make sure mana is bigger than max mana
            if (this.entity.mana > this.entity.maxMana) {
                this.entity.mana = this.entity.maxMana;
            }
        };
    }

    updateStats(): void {
        this.onStatsChange(this.currentStats);
    }

    updateBaseStats(key, value): void {
        if (this.stats[key]) {
            this.stats[key].baseValue += value;
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

    getStat(key) {
        return this.stats[key].baseValue;
    }

    applyModifiers(modifiers: StatModifiers, apply: boolean): void {
        for (let stat in modifiers) {
            if (this.stats[stat]) {
                modifiers[stat].forEach((modifier) => {
                    if (apply) {
                        this.stats[stat].addModifier(modifier);
                    } else {
                        this.stats[stat].removeModifier(modifier);
                    }
                });
            }
        }
    }

    // BUFFS / DEBUFFS
    applyBuff(buff: Buff): void {
        this.activeBuffs.push(buff);
        this.applyModifiers(buff.statModifiers, true);
        this.updateStats();

        if (buff.duration > 0) {
            setTimeout(() => {
                this.removeBuff(buff.name);
            }, buff.duration * 1000);
        }
    }

    removeBuff(buffName: string): void {
        const buff = this.activeBuffs.find((buff) => buff.name === buffName);
        if (buff) {
            this.activeBuffs = this.activeBuffs.filter((b) => b !== buff);
            this.applyModifiers(buff.statModifiers, false);
            this.updateStats();
        }
    }

    // ITEMS
    equipItem(item: Item): void {
        this.equippedItems.push(item);
        this.applyModifiers(item.statModifiers, true);
        this.updateStats();
    }

    unequipItem(item): void {
        if (item) {
            this.equippedItems = this.equippedItems.filter((i) => i !== item);
            this.applyModifiers(item.statModifiers, false);
            this.updateStats();
        }
    }
}
