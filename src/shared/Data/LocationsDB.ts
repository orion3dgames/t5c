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
        monsters: 5,
        waterPlane: true,
        skyColor: 255,
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
        monsters: 2,
        waterPlane: false,
        skyColor: 0,
    },
};

export { LocationsDB };
