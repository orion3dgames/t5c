import { raceDataMap } from "../../shared/types";

let RaceVAT = {
    humanoid: {
        key: "humanoid",
        animations: {
            ATTACK: { name: "1H_Melee_Attack_Chop", duration: 1000, speed: 1 },
            DEATH: { name: "Death_A", duration: 1000, speed: 1 },
            IDLE: { name: "Idle", duration: 1000, speed: 1 },
            WALK: { name: "Walking_B", duration: 1000, speed: 1.3 },
        },
        bones: {
            WEAPON: 12,
            OFF_HAND: 7,
            HEAD: 14,
        },
        meshes: {
            HEAD: [
                "Head_Base", //
                "Head_Barbarian",
                "Head_Engineer",
                "Head_Knight",
                "Head_Mage",
                "Head_Rogue",
            ],
            BODY: [
                "Base_Body", //
                "Armor_Robe",
            ],
        },
    },
    rat: {
        key: "rat",
        animations: {
            ATTACK: { name: "Rat_Attack", duration: 1000, speed: 1 },
            DEATH: { name: "Rat_Death", duration: 1000, speed: 1 },
            IDLE: { name: "Rat_Idle", duration: 1000, speed: 1 },
            WALK: { name: "Rat_Walk", duration: 1000, speed: 1.3 },
        },
        bones: {},
        meshes: {},
    },
};

let RacesDB: raceDataMap = {
    humanoid: {
        key: "humanoid",
        title: "Knight",
        description: "The knight is as knight should be, strong and righteous. It has a large health pool and uses stamina to cast its abilities.",
        icon: "ICON_RACE_male_knight",
        speed: 0.7,
        scale: 1,
        rotationFix: 0,
        baseHealth: 50,
        baseMana: 50,
        healthRegen: 0.1,
        manaRegen: 0.1, // per second
        experienceGain: { min: 0, max: 0 },
        goldGain: { min: 0, max: 0 },
        drops: [],
        default_abilities: ["base_attack"],
        vat: RaceVAT.humanoid,
        customizable: true,
        materials: [
            { title: "Color 1", material: "knight_texture.png" },
            { title: "Color 1", material: "knight_texture_alt_A.png" },
            { title: "Color 1", material: "knight_texture_alt_B.png" },
            { title: "Color 1", material: "knight_texture_alt_C.png" },

            { title: "Color 1", material: "mage_texture.png" },
            { title: "Color 1", material: "mage_texture_alt_A.png" },
            { title: "Color 1", material: "mage_texture_alt_B.png" },
            { title: "Color 1", material: "mage_texture_alt_C.png" },

            { title: "Color 1", material: "rogue_texture.png" },
            { title: "Color 1", material: "rogue_texture_alt_A.png" },
            { title: "Color 1", material: "rogue_texture_alt_B.png" },
            { title: "Color 1", material: "rogue_texture_alt_C.png" },

            { title: "Color 1", material: "barbarian_texture.png" },
            { title: "Color 1", material: "barbarian_texture_alt_A.png" },
            { title: "Color 1", material: "barbarian_texture_alt_B.png" },
            { title: "Color 1", material: "barbarian_texture_alt_C.png" },

            { title: "Color 1", material: "druid_texture.png" },
            { title: "Color 1", material: "druid_texture_alt_A.png" },
            { title: "Color 1", material: "druid_texture_alt_B.png" },
            { title: "Color 1", material: "druid_texture_alt_C.png" },

            { title: "Color 1", material: "engineer_texture.png" },
            { title: "Color 1", material: "engineer_texture_alt_A.png" },
            { title: "Color 1", material: "engineer_texture_alt_B.png" },
            { title: "Color 1", material: "engineer_texture_alt_C.png" },
        ],
    },

    male_knight: {
        key: "male_knight",
        title: "Knight",
        description: "The knight is as knight should be, strong and righteous. It has a large health pool and uses stamina to cast its abilities.",
        icon: "ICON_RACE_male_knight",
        speed: 0.7,
        scale: 1,
        rotationFix: 0,
        baseHealth: 50,
        baseMana: 50,
        healthRegen: 0.1,
        manaRegen: 0.1,
        experienceGain: { min: 0, max: 0 },
        goldGain: { min: 0, max: 0 },
        drops: [],
        default_abilities: ["base_attack"],
        vat: RaceVAT.humanoid,
        materials: [
            { title: "Color 1", material: "knight_texture.png" }, //
        ],
    },

    rat_01: {
        key: "rat_01",
        title: "Rat",
        description: "To be written...",
        icon: "ICON_RACE_male_mage",
        baseHealth: 50,
        baseMana: 50,
        healthRegen: 0,
        manaRegen: 0,
        experienceGain: { min: 5, max: 10 },
        goldGain: { min: 4, max: 20 },
        drops: [],
        default_abilities: ["base_attack"],
        speed: 0.1,
        scale: 1,
        rotationFix: 0,
        vat: RaceVAT.rat,
        materials: [
            { title: "Color 1", material: "knight_texture.png" }, //
        ],
    },

    /*
    male_mage: {
        key: "male_mage",
        title: "Mage",
        description:
            "The mage is a powerful class, but has a small health pool. It uses mana to cast spells, and should use its spells carefully if it does not want to run out of mana.",
        icon: "ICON_RACE_male_mage",
        speed: 0.7,
        scale: 1,
        rotationFix: Math.PI,
        meshIndex: 1,
        animations: {
            ATTACK: { name: "1H_Melee_Attack_Chop", duration: 1000, speed: 1 },
            DEATH: { name: "Death_A", duration: 1000, speed: 1 },
            IDLE: { name: "Idle", duration: 1000, speed: 1 },
            WALK: { name: "Walking_A", duration: 1000, speed: 1.3 },
        },
        bones: {
            WEAPON: 12,
            OFF_HAND: 7,
            HEAD: 14,
        },
        baseHealth: 50,
        baseMana: 50,
        healthRegen: 0.2,
        manaRegen: 0.4,
        experienceGain: { min: 0, max: 0 },
        goldGain: { min: 0, max: 0 },
        drops: [],
        default_abilities: ["base_attack"],
        materials: [
            { title: "Color 1", material: "mage_texture.png" },
            { title: "Color 2", material: "mage_texture_alt_A.png" },
            { title: "Color 3", material: "mage_texture_alt_B.png" },
        ],
        vat: "humanoid",
    },
    male_rogue: {
        key: "male_rogue",
        title: "Rogue",
        description: "To be written...",
        icon: "ICON_RACE_male_mage",
        speed: 0.4,
        scale: 1,
        rotationFix: Math.PI,
        meshIndex: 1,
        animations: {
            ATTACK: { name: "1H_Melee_Attack_Chop", duration: 1000, speed: 1 },
            DEATH: { name: "Death_A", duration: 1000, speed: 1 },
            IDLE: { name: "Idle", duration: 1000, speed: 1 },
            WALK: { name: "Walking_A", duration: 1000, speed: 1.3 },
        },
        bones: {
            WEAPON: 12,
            OFF_HAND: 7,
            HEAD: 14,
        },
        baseHealth: 50,
        baseMana: 50,
        healthRegen: 0.2,
        manaRegen: 0.4, // per second
        experienceGain: { min: 2000, max: 4000 },
        goldGain: { min: 120, max: 250 },
        drops: [
            LootTableEntry("sword_01", 10, 1, 1, 1, 1),
            LootTableEntry("potion_small_blue", 40, 1, 1, 1, 1),
            LootTableEntry("potion_small_red", 25, 1, 1, 1, 1),
            LootTableEntry("shield_01", 5, 1, 1, 1, 1),
            LootTableEntry("amulet_01", 1, 1, 1, 1, 1),
        ],
        default_abilities: ["base_attack"],
        materials: [{ title: "Color 1", material: "rogue_texture.png" }],
        vat: "humanoid",
    },*/
};

export { RacesDB, RaceVAT };
