import { Client, Room } from "colyseus.js";
import { Options } from "@colyseus/loadtest";

import node_http from "../../shared/Utils/node_http";
import Config from "../../shared/Config";

function findCurrentRoom(currentRoomKey): Promise<any> {
    return new Promise(async (resolve: any, reject: any) => {
        let rooms = await this._client.getAvailableRooms("game_room");
        if (rooms.length > 0) {
            rooms.forEach((room) => {
                if (room.metadata.location === currentRoomKey) {
                    resolve(room);
                }
            });
        }
        resolve(false);
    });
}

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

    // get random user
    let req = await node_http(Config.apiUrlLocal + "/returnRandomUser");
    let character = req.user;

    // join room
    const room: Room = await client.joinById(foundRoom.roomId, {
        token: character.token,
        character_id: character.id,
    });

    console.log("joined successfully!");

    //
    room.onMessage("*", (payload) => {
        // logic
        console.log(payload);
    });

    //
    room.onStateChange((state) => {
        console.log("state change:", state);
    });

    //
    room.onLeave((code) => {
        console.error("left", code);
    });
}
