import { Client, Room } from "colyseus.js";
import { Options } from "@colyseus/loadtest";

import node_http from "../../shared/Utils/node_http";

export async function main(options: Options) {
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

    console.log(foundRoom);

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

    //
    room.onMessage("*", (payload) => {
        // logic
        console.log(payload);
    });

    //
    room.onStateChange((state) => {
        //console.log("state change:", state);
    });

    //
    room.onLeave((code) => {
        console.error("left", code);
    });
}
