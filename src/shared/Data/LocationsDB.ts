import { Vector3 } from "../yuka-min";

let LocationsDB = {
    lh_town: {
        title: "Town",
        key: "lh_town",
        mesh: "lh_town",
        sun: true,
        sunIntensity: 1.5,
        spawnPoint: {
            x: 5,
            y: 0,
            z: -12,
            rot: -180,
        },
        waterPlane: true,
        skyColor: 255,
        dynamic: {
            teleports: [
                {
                    location: "dungeon_01",
                    point: new Vector3(-7, 0, -19),
                },
            ],
            spawns: [
                {
                    type: "global",
                    behaviour: "patrol",
                    aggressive: false,
                    canAttack: true,
                    points: [new Vector3(0, 0, 0)],
                    radius: 0,
                    amount: 0,
                    race: "male_rogue",
                    name: "Roaming Rogue",
                },
                {
                    type: "area",
                    behaviour: "patrol",
                    aggressive: true,
                    canAttack: true,
                    points: [
                        new Vector3(-7, 0, -19),
                        new Vector3(-18, 0, -27),
                        new Vector3(-12, 0, -34),
                        new Vector3(-9.8, 0, -27),
                        new Vector3(-6, 0, -23),
                        new Vector3(-18, 0, -18),
                    ],
                    radius: 0,
                    amount: 5,
                    race: "male_rogue",
                    name: "Rogue",
                },
                {
                    type: "path",
                    behaviour: "patrol",
                    aggressive: true,
                    canAttack: true,
                    points: [new Vector3(17.47, 0.04, 2.55), new Vector3(31.77, 3.54, 2.56), new Vector3(32.46, 3.54, -11.21), new Vector3(16.87, 0.04, -8.92)],
                    radius: 0,
                    amount: 1,
                    race: "male_rogue",
                    name: "Rogue",
                },
                {
                    type: "static",
                    behaviour: "idle",
                    aggressive: false,
                    canAttack: false,
                    points: [new Vector3(38.7, 3.51, -11.81)],
                    radius: 0,
                    amount: 1,
                    race: "male_knight",
                    name: "Alexander The Righteous",
                },
                {
                    type: "static",
                    behaviour: "idle",
                    aggressive: false,
                    canAttack: false,
                    points: [new Vector3(9.67, 0, -28.58)],
                    radius: 0,
                    amount: 1,
                    race: "male_mage",
                    name: "Priestess",
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
        spawnPoint: {
            x: 11.33,
            y: 0,
            z: -2.51,
            rot: -180,
        },
        waterPlane: false,
        skyColor: 0,
        dynamic: {
            dynamic: {
                teleports: [
                    {
                        location: "lh_town",
                        point: new Vector3(13, 0, -26),
                    },
                ],
                spawns: [
                    {
                        type: "global",
                        behaviour: "patrol",
                        aggressive: true,
                        points: [],
                        radius: 0,
                        amount: 5,
                        race: "male_enemy",
                        name: "Pirate",
                    },
                ],
            },
        },
    },
};

export { LocationsDB };
