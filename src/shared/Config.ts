
let Config = {

    // basic server settings
    serverUrlLocal: "ws://localhost:3000",
    serverUrlProduction: "wss://t5c.onrender.com",
    maxClients: 64, // set maximum clients per room
    updateRate: 100, // Set frequency the patched state should be sent to all clients, in milliseconds

    // basic locations
    initialLocation: "town",
    secondaryLocation: "island",
    locations: {
        "town": {
            title: "Town",
            key: 'town',
            mesh: "town.glb",
            spawnPoint: {
                x: -38.13,
                y: 0,
                z: 1.5
            },
        },
        "island": {
            title: "Island",
            key: 'island',
            mesh: "island.glb",
            spawnPoint: {
                x: 33.29,
                y: 0,
                z: 27.82
            },
        },
    }


}

export default Config