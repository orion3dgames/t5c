import { Vector3 } from "@babylonjs/core/Maths/math.vector";

let LocationsDB = {
    lh_town: {
        title: "Town",
        key: "lh_town",
        mesh: "lh_town",
        sun: true,
        sunIntensity: 2.5,
        spawnPoint: {
            x: 0,
            y: 0,
            z: 0,
            rot: -180,
        },
        monsters: 10,
        waterPlane: true,
        skyColor: 255,
        dynamic: {
            spawns: [
                {
                    type: "wander",
                    amount: 5,
                    race: "male_enemy",
                },
                {
                    type: "area",
                    points: [
                        { x: -14, y: 0, z: 3.6 },
                        { x: 3.7, y: 0, z: 3.4 },
                        { x: 3.7, y: 0, z: 15.3 },
                        { x: 13.45, y: 0, z: 14.63 },
                    ],
                    amount: 10,
                    race: "male_enemy",
                },
                {
                    type: "point",
                    point: { x: -8, y: 0, z: 14.7 },
                    radius: 5,
                    amount: 5,
                    race: "male_enemy",
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
        monsters: 5,
        waterPlane: false,
        skyColor: 0,
        dynamic: {
            spawns: [
                {
                    type: "global",
                    amount: 1,
                    race: "male_enemy",
                },
            ],
        },
    },
};

export { LocationsDB };
