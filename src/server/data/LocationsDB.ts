import { PlayerSlots, Speed } from "../../shared/types";
import { Vector3 } from "../../shared/Libs/yuka-min";
import { LootTableEntry } from "../../shared/Class/LootTable";

const DEFAULT_LOOT = [
    LootTableEntry("sword_01", 10, 1, 1, 1, 1),
    LootTableEntry("potion_small_blue", 40, 1, 1, 1, 1),
    LootTableEntry("potion_small_red", 25, 1, 1, 1, 1),
    LootTableEntry("shield_01", 5, 1, 1, 1, 1),
    LootTableEntry("armor_01", 5, 1, 1, 1, 1),
    LootTableEntry("amulet_01", 1, 1, 1, 1, 1),
];

let LocationsDB = {
    lh_town: {
        title: "Lighthaven",
        key: "lh_town",
        mesh: "lh_town",
        sun: true,
        sunIntensity: 0.6,
        spawnPoint: {
            x: 0,
            y: 0,
            z: 0,
            rot: -180,
        },
        waterPlane: true,
        skyColor: [0, 0, 0, 1],
        fog: true,
        music: "MUSIC_01",
        dynamic: {
            interactive: [
                {
                    type: "zone_change",
                    from: new Vector3(13.82, 0.1, -33.46),
                    to_map: "training_ground",
                    to_vector: new Vector3(0, 0, 0),
                },
                {
                    // to secret spot
                    type: "teleport",
                    from: new Vector3(-18.5, 0, -36.92),
                    to_vector: new Vector3(-8, 0, -52),
                },
                {
                    // back to lh_town
                    type: "teleport",
                    from: new Vector3(-8.4, 0, -49.08),
                    to_vector: new Vector3(-22, 0, -37.8),
                },
            ],
            spawns: [
                ///////////////////////
                ///////// NPC /////////

                // BLACKSMITH
                {
                    key: "lh_town_blacksmith",
                    type: "static",
                    behaviour: "idle",
                    aggressive: false,
                    canAttack: false,
                    points: [new Vector3(31.22, 0.06, -24.19)],
                    rotation: 2.75,
                    amount: 1,
                    race: "humanoid",
                    material: 3,
                    head: "Head_Barbarian",
                    name: "Blacksmith Garin",
                    equipment: [
                        {
                            key: "armor_02",
                            slot: PlayerSlots.CHEST,
                        },
                        {
                            key: "shield_01",
                            slot: PlayerSlots.OFF_HAND,
                        },
                        {
                            key: "sword_01",
                            slot: PlayerSlots.WEAPON,
                        },
                    ],
                    interactable: {
                        title: "Talk",
                        data: [
                            {
                                type: "text",
                                text: "Greetings, adventurer! Looking for a new weapon or some sturdy armor? I've got the finest in Eldoria.",
                                vendor: {
                                    items: [
                                        { key: "shield_01" }, //
                                        { key: "sword_01" },
                                        { key: "amulet_01" },
                                        { key: "helm_01" },
                                        { key: "armor_01" },
                                        { key: "armor_02" },
                                    ],
                                },
                                isEndOfDialog: true,
                            },
                        ],
                    },
                },

                // MERCHANT
                {
                    key: "lh_town_merchant",
                    type: "static",
                    behaviour: "idle",
                    aggressive: false,
                    canAttack: false,
                    points: [new Vector3(10.18, 0.06, 25.43)],
                    rotation: 2.7,
                    amount: 1,
                    race: "humanoid",
                    material: 9,
                    head: "Head_Rogue",
                    name: "Merchant Elara",
                    interactable: {
                        title: "Talk",
                        data: [
                            {
                                type: "text",
                                text: "Remember, a well-prepared adventurer is a successful adventurer. Stock up before you head out!",
                                vendor: {
                                    items: [{ key: "potion_small_red" }, { key: "potion_small_blue" }],
                                },
                                isEndOfDialog: true,
                            },
                        ],
                    },
                },

                // SORCERESS
                {
                    key: "lh_town_sorceress",
                    type: "static",
                    behaviour: "idle",
                    aggressive: false,
                    canAttack: false,
                    points: [new Vector3(59.43, 8.01, 40.29)],
                    rotation: 2.79,
                    radius: 0,
                    amount: 1,
                    race: "humanoid",
                    material: 7,
                    head: "Head_Mage",
                    name: "Mira The Sorceress",
                    baseHealth: 5000,
                    equipment: [
                        {
                            key: "hat_01",
                            slot: PlayerSlots.HEAD,
                        },
                    ],
                    interactable: {
                        title: "Talk",
                        data: [
                            {
                                type: "text",
                                text: "Ah, another seeker of knowledge. What arcane mysteries can I help you unlock today?",
                                trainer: {
                                    abilities: [{ key: "fire_dart" }, { key: "poison" }],
                                },
                            },
                        ],
                    },
                },

                // PRIESTESS
                {
                    key: "lh_town_priestress",
                    type: "static",
                    behaviour: "idle",
                    aggressive: false,
                    canAttack: false,
                    points: [new Vector3(7.45, 0.1, -28.12)],
                    rotation: 3.12,
                    amount: 2,
                    race: "humanoid",
                    material: 6,
                    head: "Head_Mage",
                    name: "Priestess Alice ",
                    equipment: [
                        {
                            key: "hat_01",
                            slot: PlayerSlots.HEAD,
                        },
                    ],
                    interactable: {
                        title: "Talk",
                        data: [
                            {
                                type: "text",
                                text: "Blessings of Athlea upon you. How can I assist you in your journey?",
                                quests: [{ key: "LH_DANGEROUS_ERRANDS_01" }],
                                trainer: {
                                    abilities: [{ key: "light_heal" }],
                                },
                                buttons: [
                                    { label: "Can you heal me?", goToDialog: 1 },
                                    { label: "Sorry, I'm busy adventuring.", goToDialog: 2 },
                                ],
                            },
                            {
                                type: "text",
                                text: "Praise be to the Goddess Athlea for her benevolent grace! I am but her humble vessel, and it is her divine power that has allowed me to aid in your healing. Please take a moment to rest and recover. If you have any questions or seek further guidance, do not hesitate to ask. The goddess's blessings are with you, and I am here to support you in your time of need.",
                                isEndOfDialog: true,
                                triggeredByClosing: {
                                    type: "cast_ability",
                                    ability: "heal",
                                    target: "target",
                                },
                            },
                            {
                                type: "text",
                                text: "Very well, may the Goddess watch over your chosen path.",
                                buttonName: "Thank you",
                                isEndOfDialog: true,
                            },
                        ],
                    },
                },

                // FARMER
                {
                    key: "lh_town_farmer",
                    type: "static",
                    behaviour: "idle",
                    aggressive: false,
                    canAttack: false,
                    points: [new Vector3(13.15, 0.06, 41.13)],
                    rotation: 2.4,
                    amount: 1,
                    race: "humanoid",
                    material: 15,
                    head: "Head_Engineer",
                    name: "Farmer Jorin",
                    interactable: {
                        title: "Talk",
                        data: [
                            {
                                type: "text",
                                text: "It's hard work, but honest work. The land provides for those who tend to it with care",
                                isEndOfDialog: true,
                            },
                        ],
                    },
                },

                // BARTENDER
                {
                    key: "lh_town_bartender",
                    type: "static",
                    behaviour: "idle",
                    aggressive: false,
                    canAttack: false,
                    points: [new Vector3(40.32, 0.1, 20.88)],
                    rotation: 1.85,
                    amount: 1,
                    race: "humanoid",
                    material: 19,
                    head: "Head_Engineer",
                    name: "Bartender Morin",
                    interactable: {
                        title: "Talk",
                        data: [
                            {
                                type: "text",
                                text: "Welcome to the tavern! Sit, have a drink, and share your tales of adventure.",
                                isEndOfDialog: true,
                            },
                        ],
                    },
                },

                // CARETAKER
                {
                    key: "lh_town_caretaker",
                    type: "static",
                    behaviour: "idle",
                    aggressive: false,
                    canAttack: false,
                    points: [new Vector3(47.54, 0.06, 67.27)],
                    rotation: 1.5,
                    amount: 1,
                    race: "humanoid",
                    material: 8,
                    head: "Head_Barbarian",
                    name: "Caretaker Ren",
                    interactable: {
                        title: "Talk",
                        data: [
                            {
                                type: "text",
                                text: "The cemetery holds many secrets. Respect the dead, and they may offer you their wisdom.",
                                isEndOfDialog: true,
                            },
                        ],
                    },
                },

                // MADAME SERAPHINA
                {
                    key: "lh_town_seraphina",
                    type: "static",
                    behaviour: "idle",
                    aggressive: false,
                    canAttack: false,
                    points: [new Vector3(-12.24, 0.06, 17.5)],
                    rotation: -1.5,
                    amount: 2,
                    race: "humanoid",
                    material: 12,
                    head: "Head_Mage",
                    name: "Madame Seraphina",
                    interactable: {
                        title: "Talk",
                        data: [
                            {
                                type: "text",
                                text: "Ah, a new face! Please, make yourself at home and enjoy our performances.",
                                isEndOfDialog: true,
                            },
                        ],
                    },
                },

                {
                    key: "lh_town_citizen",
                    type: "path",
                    behaviour: "patrol",
                    aggressive: false,
                    canAttack: false,
                    points: [
                        new Vector3(26.33, 0.06, -8.77),
                        new Vector3(25.96, 0.06, 25.97),
                        new Vector3(-18.52, 0.06, 30.14),
                        new Vector3(-23.42, 0.06, 8.63),
                        new Vector3(-14.8, 0.06, -8.68),
                    ],
                    rotation: -1.5,
                    amount: 5,
                    race: "humanoid",
                    material: 0,
                    head: "Head_Base",
                    name: "Citizen",
                    baseSpeed: Speed.VERY_SLOW,
                    randomize: true,
                    interactable: {
                        title: "Talk",
                        data: [
                            {
                                type: "text",
                                text: "Ah, @PlayerName!. It's nice to meet you.",
                                isEndOfDialog: true,
                            },
                        ],
                    },
                },

                ////////////////////////
                //////// ENEMIES ///////

                {
                    key: "lh_town_bandits2",
                    type: "area",
                    behaviour: "patrol",
                    aggressive: true,
                    canAttack: true,
                    points: [new Vector3(36.29, 0.06, -0.59), new Vector3(45.93, 0.06, 0.88), new Vector3(40.4, 0.06, 7.2), new Vector3(32.86, 0.06, 8.73)],
                    amount: 5,
                    race: "skeleton_01",
                    material: 0,
                    name: "Skeleton",
                    baseHealth: 100,
                    baseSpeed: Speed.VERY_SLOW,
                    baseDamageMultiplier: 1, // multiplicater for damage
                    experienceGain: { min: 100, max: 200 },
                    goldGain: { min: 10, max: 20 },
                    equipment: [
                        {
                            key: "shield_01",
                            slot: PlayerSlots.OFF_HAND,
                        },
                        {
                            key: "sword_01",
                            slot: PlayerSlots.WEAPON,
                        },
                    ],
                    abilities: [{ key: "base_attack", chance: 1 }],
                    drops: DEFAULT_LOOT,
                },

                {
                    key: "lh_town_bandits",
                    type: "area",
                    behaviour: "patrol",
                    aggressive: true,
                    canAttack: true,
                    points: [
                        new Vector3(-11.15, 0.06, 68.05),
                        new Vector3(-10.45, 0.06, 87.2),
                        new Vector3(1.1, 0.06, 79.36),
                        new Vector3(14.34, 0.06, 86.56),
                        new Vector3(27.81, 0.06, 89.47),
                        new Vector3(44.71, 0.06, 82.98),
                        new Vector3(28.44, 0.06, 78.08),
                    ],
                    amount: 10,
                    race: "humanoid",
                    material: 17,
                    head: "Head_Rogue",
                    name: "Bandit",
                    baseHealth: 100,
                    baseSpeed: Speed.VERY_SLOW,
                    baseDamageMultiplier: 2, // multiplicater for damage
                    experienceGain: { min: 1000, max: 2000 },
                    goldGain: { min: 100, max: 200 },
                    equipment: [
                        {
                            key: "shield_01",
                            slot: PlayerSlots.OFF_HAND,
                        },
                        {
                            key: "sword_01",
                            slot: PlayerSlots.WEAPON,
                        },
                    ],
                    abilities: [
                        { key: "base_attack", chance: 0.8 },
                        { key: "slice_attack", chance: 0.2 },
                        { key: "fire_dart", chance: 0.1 },
                    ],
                    drops: DEFAULT_LOOT,
                },
            ],
        },
    },
    training_ground: {
        title: "Training Ground",
        key: "training_ground",
        mesh: "training_ground",
        sun: true,
        sunIntensity: 1,
        fog: false,
        spawnPoint: {
            x: 0,
            y: 0,
            z: 0,
            rot: -180,
        },
        waterPlane: false,
        skyColor: [0, 0, 0, 1],
        music: "MUSIC_01",
        dynamic: {
            interactive: [],
            spawns: [
                {
                    key: "spawn_01",
                    type: "static",
                    behaviour: "idle",
                    aggressive: true,
                    canAttack: true,
                    points: [new Vector3(8.67, 0, -14.59)],
                    amount: 1,
                    baseHealth: 8000,
                    race: "skeleton_01",
                    material: 0,
                    name: "Dummy 2",
                    baseSpeed: Speed.VERY_SLOW,
                },
                {
                    key: "spawn_02",
                    type: "global",
                    behaviour: "area",
                    aggressive: true,
                    canAttack: true,
                    points: [new Vector3(12, 0, -14.59)],
                    amount: 1,
                    race: "skeleton_01",
                    material: 0,
                    name: "Dummy 1",

                    baseHealth: 100,
                    baseSpeed: Speed.VERY_SLOW,
                    baseDamageMultiplier: 2, // multiplicater for damage
                    experienceGain: { min: 5000, max: 10000 },
                    goldGain: { min: 100, max: 200 },
                    equipment: [
                        {
                            key: "sword_01",
                            slot: PlayerSlots.WEAPON,
                        },
                    ],
                    abilities: [
                        { key: "base_attack", chance: 0.3 },
                        { key: "fire_dart", chance: 0.7 },
                    ],
                },
            ],
        },
    },
    lh_dungeon_01: {
        title: "Dungeon Level 1",
        key: "lh_dungeon_01",
        mesh: "lh_dungeon_01",
        sun: false,
        sunIntensity: 1,
        fog: false,
        spawnPoint: {
            x: 0,
            y: 0,
            z: 0,
            rot: -180,
        },
        waterPlane: false,
        skyColor: [0, 0, 0, 1],
        music: "MUSIC_01",
        dynamic: {
            interactive: [
                {
                    type: "zone_change",
                    from: new Vector3(1.3, 0.5, -3.3),
                    to_map: "lh_town",
                    to_vector: new Vector3(13, 0, -25.7),
                },
            ],
            spawns: [
                {
                    key: "spawn_01",
                    type: "global",
                    behaviour: "patrol",
                    aggressive: true,
                    canAttack: true,
                    points: [
                        new Vector3(-10.6, 0.1, -2.55),
                        new Vector3(-20.54, 0.1, 7.72),
                        new Vector3(-20.75, 0.1, -2.05),
                        new Vector3(-21.42, 0.1, -19.39),
                        new Vector3(-14.59, 0.1, -30.15),
                        new Vector3(2.78, 0.1, -30.45),
                    ],
                    radius: 0,
                    amount: 25,
                    race: "rat_01",
                    material: 0,
                    name: "Rat",
                    baseSpeed: Speed.VERY_SLOW,
                },
            ],
        },
    },
};

export { LocationsDB };
