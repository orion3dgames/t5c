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
                    type: "global",
                    behaviour: "patrol",
                    aggressive: 1,
                    description: "will randomly patrol along the navmesh",
                    points: [],
                    radius: 0,
                    amount: 1,
                    race: "male_enemy",
                },
                {
                    type: "area",
                    behaviour: "patrol",
                    aggressive: 1,
                    description: "will randomly patrol along the navmesh within the defined points",
                    points: [
                        { x: -14, y: 0, z: 3.6 },
                        { x: 3.7, y: 0, z: 3.4 },
                        { x: 3.7, y: 0, z: 15.3 },
                        { x: 13.45, y: 0, z: 14.63 },
                    ],
                    radius: 0,
                    amount: 5,
                    race: "male_enemy",
                },
                {
                    type: "path",
                    behaviour: "patrol",
                    aggressive: 1,
                    description:
                        "Will patrol along a path of points going back and forth (not sure about this one, maybe once it gets to the end it should go back to the first point?)",
                    points: [
                        { x: -14, y: 0, z: 3.6 },
                        { x: 3.7, y: 0, z: 3.4 },
                        { x: 3.7, y: 0, z: 15.3 },
                        { x: 13.45, y: 0, z: 14.63 },
                    ],
                    radius: 0,
                    amount: 1,
                    race: "male_enemy",
                },
                {
                    type: "point",
                    behaviour: "patrol",
                    aggressive: 1,
                    description: "will randomly patrol along the navmesh within the defined radius around a point.",
                    points: [{ x: -8, y: 0, z: 14.7 }],
                    radius: 5,
                    amount: 5,
                    race: "male_enemy",
                },
                {
                    type: "point",
                    behaviour: "idle",
                    aggressive: 0,
                    description: "will spawn on a point and stay idle, maybe useful for potential NPC's?.",
                    points: [{ x: -9, y: 0, z: 15.7 }],
                    radius: 0,
                    amount: 1,
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
