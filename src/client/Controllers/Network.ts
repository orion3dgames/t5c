// colyseus
import { Client, Room } from "colyseus.js";
import { isLocal } from "../Utils";

export class Network {
    public _client;

    constructor(port) {
        // create colyseus client
        let url = "wss://" + window.location.hostname;
        if (isLocal()) {
            url = "ws://localhost:" + port;
        }
        this._client = new Client(url);
    }

    public async joinRoom(roomId, token, character_id): Promise<any> {
        return await this._client.joinById(roomId, {
            token: token,
            character_id: character_id,
        });
    }

    public async joinChatRoom(data): Promise<any> {
        return await this._client.joinOrCreate("chat_room", data);
    }

    public async findCurrentRoom(currentRoomKey): Promise<any> {
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
}
