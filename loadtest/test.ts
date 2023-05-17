import { Client, Room } from "colyseus.js";
import { cli, Options } from "@colyseus/loadtest";

import node_http from "../src/shared/Utils/node_http";

async function main(options: Options) {
    const client = new Client(options.endpoint);

    // get room
    let foundRoom;
    let rooms = await client.getAvailableRooms("game_room");
    if (rooms.length > 0) {
        rooms.forEach((r) => {
            if (r.metadata.location === "lh_town") {
                foundRoom = r;
            }
        });
    }
    if (foundRoom) {
        // get random user
        let req = await node_http("http://localhost:8080/returnRandomUser");
        let character = req.user;

        // join room
        const room: Room = await client.joinById(foundRoom.roomId, {
            token: character.token,
            character_id: character.id,
        });

        let sessionId = room.sessionId;
        let player = room.state.players.get(sessionId);

        console.log("joined successfully!", player);

        room.onMessage("*", (type, message) => {
            console.log("onMessage:", type, message);
        });

        room.onStateChange((state) => {
            console.log(room.sessionId, "new state:", state);
        });

        room.onError((err) => {
            console.log(room.sessionId, "!! ERROR !!", err);
        });

        room.onLeave((code) => {
            console.log(room.sessionId, "left.");
        });
    }
}

cli(main);
