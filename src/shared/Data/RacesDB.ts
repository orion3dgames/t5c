import { AbilityItem } from "src/server/rooms/schema/AbilityItem";
import { ILootTableEntry, LootTableEntry } from "../Entities/Player/LootTable";

type Race = {
    key: string;
    title: string;
    speed: number;
    scale: number;
    rotationFix: number;
    animationSpeed: number;
    meshIndex: number;
    animations: {
        [key: string]: number;
    };
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
    male_adventurer: {
        key: "male_adventurer",
        title: "Adventurer",
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
        baseHealth: 100,
        baseMana: 100,
        healthRegen: 0.2,
        manaRegen: 0.4, // per second
        experienceGain: {},
        goldGain: {},
        damage_multiplier: 0,
        drops: [],
        default_abilities: ["base_attack"],
    },
    player_hobbit: {
        key: "player_hobbit",
        title: "Hobbit",
        speed: 0.6,
        scale: 0.02,
        rotationFix: 0,
        animationSpeed: 1.3,
        meshIndex: 2,
        animations: {
            IDLE: 3,
            WALK: 6,
            ATTACK: 0,
            DEATH: 2,
            DAMAGE: 1,
        },
        baseHealth: 100,
        baseMana: 100,
        healthRegen: 0.2,
        manaRegen: 0.4, // per second
        experienceGain: {},
        goldGain: {},
        damage_multiplier: 0,
        drops: [],
        default_abilities: ["base_attack"],
    },
    monster_bear: {
        key: "monster_bear",
        title: "Bear",
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
    monster_unicorn: {
        key: "monster_unicorn",
        title: "Unicorn",
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
};

export { RacesDB, Race };
