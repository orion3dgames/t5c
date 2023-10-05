import { PlayerSlots } from "../../shared/types";
import { Vector3 } from "../../shared/Libs/yuka-min";

let LocationsDB = {
    lh_town: {
        title: "Town",
        key: "lh_town",
        mesh: "lh_town",
        sun: true,
        sunIntensity: 1.5,
        fog: false,
        spawnPoint: {
            x: 0,
            y: 0,
            z: 0,
            rot: -180,
        },
        waterPlane: true,
        skyColor: 255,
        dynamic: {
            interactive: [
                {
                    type: "zone_change",
                    from: new Vector3(13.87, 0, -29.84),
                    to_map: "lh_dungeon_01",
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
                {
                    type: "area",
                    behaviour: "patrol",
                    aggressive: true,
                    canAttack: true,
                    points: [
                        new Vector3(-7, 0, -19),
                        new Vector3(-10.42, 0.01, -27.33),
                        new Vector3(-18, 0, -27),
                        new Vector3(-12, 0, -34),
                        new Vector3(-9.8, 0, -27),
                        new Vector3(-6, 0, -23),
                        new Vector3(-18, 0, -18),
                        new Vector3(-22.33, 0.01, -21.03),
                        new Vector3(-8.8, 0.01, -22.39),
                        new Vector3(-8.51, 0.01, -14.93),
                    ],
                    amount: 5,
                    race: "male_rogue",
                    material: 0,
                    name: "Rogue",
                    equipment: [
                        {
                            slot: PlayerSlots.WEAPON,
                            key: "sword_01",
                        },
                        {
                            slot: PlayerSlots.HEAD,
                            key: "helm_01",
                        },
                        {
                            slot: PlayerSlots.OFF_HAND,
                            key: "shield_01",
                        },
                    ],
                },
                {
                    type: "path",
                    behaviour: "patrol",
                    aggressive: true,
                    canAttack: true,
                    points: [new Vector3(17.47, 0.04, 2.55), new Vector3(31.77, 3.54, 2.56), new Vector3(32.46, 3.54, -11.21), new Vector3(16.87, 0.04, -8.92)],
                    amount: 1,
                    race: "male_rogue",
                    material: 0,
                    name: "Rogue",
                },
                {
                    type: "static",
                    behaviour: "idle",
                    aggressive: false,
                    canAttack: false,
                    points: [new Vector3(38.7, 3.51, -11.81)],
                    amount: 1,
                    race: "male_knight",
                    material: 3,
                    name: "Alexander The Righteous",
                },
                {
                    type: "static",
                    behaviour: "idle",
                    aggressive: false,
                    canAttack: true,
                    points: [new Vector3(9.67, 0, -28.58)],
                    amount: 1,
                    race: "male_mage",
                    material: 2,
                    name: "Alice",
                    interactable: {
                        distance: 2,
                        dialog: [
                            {
                                text: "Hi, I'm Alice, welcome @PlayerName ",
                            },
                            {
                                text: "Are you in search of healing?",
                                isQuestion: true,
                                buttons: [
                                    { label: "Yes", goToDialog: 2 },
                                    { label: "No", goToDialog: 3 },
                                ],
                            },
                            {
                                text: "Ok, please do not move while I heal you!",
                                isEndOfDialog: true,
                                triggeredByClosing: (owner) => {
                                    owner.heal();
                                },
                            },
                            {
                                text: "Ok, please come back later if you're in need of healing.",
                                isEndOfDialog: true,
                            },
                        ],
                    },
                },
                {
                    type: "static",
                    behaviour: "idle",
                    aggressive: false,
                    canAttack: true,
                    points: [new Vector3(13.1, 0, -13.7)],
                    radius: 0,
                    amount: 1,
                    race: "male_mage",
                    material: 1,
                    name: "Harmless Dummy",
                    baseHealth: 5000,
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
        skyColor: 0,
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
                    amount: 6,
                    race: "male_rogue",
                    material: 0,
                    name: "Roaming Rogue",
                },
            ],
        },
    },
};

export { LocationsDB };
