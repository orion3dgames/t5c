
let Config = {

    // basic server settings
    serverUrlLocal: "ws://localhost:3000",
    serverUrlProduction: "wss://t5c.onrender.com",
    maxClients: 64, // set maximum clients per room
    updateRate: 75, // Set frequency the patched state should be sent to all clients, in milliseconds

    // basic locations
    initialLocation: "island",
    locations: {
        "town": {
            title: "Town",
            spawnPoint: {
                x: 0,
                y: 0,
                z: 0
            },
        },
        "island": {
            title: "Island",
            spawnPoint: {
                x: 33.29,
                y: 0,
                z: 27.82
            },
        },
    }


}

export default Config