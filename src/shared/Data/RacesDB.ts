import { ILootTableEntry, LootTableEntry } from "../Entities/Player/LootTable";

type Race = {
    key: string;
    title: string;
    icon: string;
    speed: number;
    scale: number;
    rotationFix: number;
    animationSpeed: number;
    meshIndex: number;
    animations: {
        [key: string]: number;
    };
    bones?: { [key: string]: number };
    baseHealth: number;
    baseMana: number;
    healthRegen: number;
    manaRegen: number;
    experienceGain: {};
    goldGain: {};
    damage_multiplier: number;
    drops?: ILootTableEntry[];
    default_abilities?: string[];
};

interface raceDataMap {
    [key: string]: Race;
}

let RacesDB: raceDataMap = {
    male_knight: {
        key: "male_knight",
        title: "Knight",
        icon: "ICON_RACE_male_adventurer",
        speed: 0.6,
        scale: 0.7,
        rotationFix: Math.PI,
        animationSpeed: 1.3,
        meshIndex: 1,
        animations: {
            IDLE: 36,
            WALK: 72,
            ATTACK: 1,
            DEATH: 23,
            DAMAGE: 34,
        },
        bones: {
            WEAPON: 12,
            OFF_HAND: 7,
        },
        baseHealth: 50,
        baseMana: 50,
        healthRegen: 0.2,
        manaRegen: 0.4, // per second
        experienceGain: {},
        goldGain: {},
        damage_multiplier: 0,
        drops: [],
        default_abilities: ["base_attack"],
    },
    male_adventurer: {
        key: "male_adventurer",
        title: "Adventurer",
        icon: "ICON_RACE_male_adventurer",
        speed: 0.6,
        scale: 1.3,
        rotationFix: Math.PI,
        animationSpeed: 1.3,
        meshIndex: 1,
        animations: {
            IDLE: 4,
            WALK: 22,
            ATTACK: 21,
            DEATH: 0,
            DAMAGE: 1,
        },
        bones: {
            WEAPON: 37,
            OFF_HAND: 14,
        },
        baseHealth: 50,
        baseMana: 50,
        healthRegen: 0.2,
        manaRegen: 0.4, // per second
        experienceGain: {},
        goldGain: {},
        damage_multiplier: 0,
        drops: [],
        default_abilities: ["base_attack"],
    },
    male_enemy: {
        key: "male_enemy",
        title: "Enemy",
        icon: "ICON_RACE_male_enemy",
        speed: 0.3,
        scale: 1.3,
        rotationFix: Math.PI,
        animationSpeed: 1.3,
        meshIndex: 1,
        animations: {
            IDLE: 4,
            WALK: 22,
            ATTACK: 21,
            DEATH: 0,
            DAMAGE: 1,
        },
        bones: {
            WEAPON: 37,
            OFF_HAND: 14,
        },
        baseHealth: 20,
        baseMana: 20,
        healthRegen: 0.2,
        manaRegen: 0.4, // per second
        experienceGain: { min: 2000, max: 4000 },
        goldGain: { min: 120, max: 250 },
        damage_multiplier: 1.3,
        drops: [
            LootTableEntry("sword_01", 10, 1, 1, 1, 1),
            LootTableEntry("potion_heal", 25, 1, 1, 1, 1),
            LootTableEntry("pear", 5, 1, 10, 1, 1),
            LootTableEntry("apple", 20, 1, 10, 1, 1),
            LootTableEntry(null, 20, 1, 1, 1, 1),
            LootTableEntry("amulet_01", 1, 1, 1, 1, 2),
            LootTableEntry(null, 80, 1, 1, 1, 2),
        ],
        default_abilities: ["base_attack"],
    },
    /*
    monster_bear: {
        key: "monster_bear",
        title: "Bear",
        icon: "ICON_RACE_monster_bear",
        speed: 0.2,
        scale: 0.02,
        rotationFix: 3.14,
        animationSpeed: 1,
        meshIndex: 3,
        animations: {
            IDLE: 0,
            WALK: 3,
            ATTACK: 2,
            DEATH: 4,
            DAMAGE: 5,
        },
        baseHealth: 200,
        baseMana: 100,
        healthRegen: 0.2,
        manaRegen: 0.4, // per second
        experienceGain: { min: 2000, max: 4000 },
        goldGain: { min: 120, max: 250 },
        damage_multiplier: 1.3,
        drops: [
            LootTableEntry("sword_01", 10, 1, 1, 1, 1),
            LootTableEntry("potion_heal", 25, 1, 1, 1, 1),
            LootTableEntry("pear", 5, 1, 10, 1, 1),
            LootTableEntry("apple", 20, 1, 10, 1, 1),
            LootTableEntry(null, 20, 1, 1, 1, 1),
            LootTableEntry("amulet_01", 1, 1, 1, 1, 2),
            LootTableEntry(null, 80, 1, 1, 1, 2),
        ],
        default_abilities: ["base_attack"],
    },
    /*
    monster_unicorn: {
        key: "monster_unicorn",
        title: "Unicorn",
        icon: "ICON_RACE_monster_unicorn",
        speed: 0.3,
        scale: 0.0125,
        rotationFix: 3.14,
        animationSpeed: 1,
        meshIndex: 3,
        animations: {
            IDLE: 5,
            WALK: 6,
            ATTACK: 0,
            DEATH: 3,
            DAMAGE: 5,
        },
        baseHealth: 100,
        baseMana: 100,
        healthRegen: 0.2,
        manaRegen: 0.4, // per second
        experienceGain: { min: 300, max: 600 },
        goldGain: { min: 45, max: 75 },
        damage_multiplier: 1,
        drops: [
            LootTableEntry("sword_01", 10, 1, 1, 1, 1),
            LootTableEntry("potion_heal", 10, 1, 1, 1, 1),
            LootTableEntry("pear", 15, 1, 10, 1, 1),
            LootTableEntry("apple", 20, 1, 10, 1, 1),
            LootTableEntry(null, 20, 1, 1, 1, 1),
            LootTableEntry("amulet_01", 1, 1, 1, 1, 2),
            LootTableEntry(null, 80, 1, 1, 1, 2),
        ],
        default_abilities: ["base_attack"],
    },
    */
};

export { RacesDB, Race };
