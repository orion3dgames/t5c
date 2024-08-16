import { raceDataMap } from "../../shared/types";

let RaceVAT = {
    humanoid: {
        key: "humanoid",
        animations: {
            ATTACK_01: { name: "1H_Melee_Attack_Chop", duration: 2000, speed: 1.5, loop: false },
            ATTACK_02: { name: "1H_Melee_Attack_Slice_Horizontal", duration: 2000, speed: 0.75, loop: false },
            DEATH: { name: "Death_A", duration: 1000, speed: 1, loop: false },
            HIT_A: { name: "Hit_A", duration: 1000, speed: 1, loop: true },
            IDLE: { name: "Idle", duration: 1000, speed: 1, loop: true },
            SPELL_CAST: { name: "Spellcast_Shoot", duration: 1000, speed: 1, loop: false },
            SPELL_CASTING: { name: "Spellcasting", duration: 2000, speed: 1, loop: true },
            UNARMED: { name: "Unarmed_Melee_Attack_Punch_A", duration: 1000, speed: 1, loop: true },
            WALK: { name: "Walking_B", duration: 1000, speed: 1, loop: true },
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
                "Head_Mage",
                "Head_Rogue",
                "Head_Paladin",
            ],
        },
    },
    rat: {
        key: "rat_01",
        animations: {
            ATTACK_1: { name: "Rat_Attack", duration: 2000, speed: 1 },
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
        title: "Human",
        description: "The knight is as knight should be, strong and righteous. It has a large health pool and uses stamina to cast its abilities.",
        icon: "ICON_RACE_male_knight",
        speed: 0.6,
        scale: 1,
        rotationFix: Math.PI,
        baseHealth: 50,
        baseMana: 50,
        healthRegen: 5,
        manaRegen: 5, // per second
        experienceGain: { min: 1, max: 1 },
        goldGain: { min: 1, max: 1 },
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

    skeleton_01: {
        key: "skeleton_01",
        title: "Skeleton",
        description: "The knight is as knight should be, strong and righteous. It has a large health pool and uses stamina to cast its abilities.",
        icon: "ICON_RACE_skeleton_01",
        speed: 0.7,
        scale: 1,
        rotationFix: Math.PI,
        baseHealth: 50,
        baseMana: 50,
        healthRegen: 0.1,
        manaRegen: 0.1,
        experienceGain: { min: 1, max: 1 },
        goldGain: { min: 1, max: 1 },
        drops: [],
        default_abilities: ["base_attack"],
        vat: RaceVAT.humanoid,
        materials: [
            { title: "Color 1", material: "skeleton_texture.png" }, //
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
