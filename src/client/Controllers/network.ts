import { Scene } from '@babylonjs/core';

// colyseus
import { Client, Room } from "colyseus.js";
import Config from '../../shared/Config';

export class GameNetwork {

    public _client;
    public _scene;

    constructor(scene: Scene) {

        this._scene = scene;

        // create colyseus client
        // this should use environement values
        if (window.location.host === "localhost:8080") {
            this._client = new Client(Config.serverUrlLocal); // local
        }else{
            this._client = new Client(Config.serverUrlProduction); // online
        }   
    }

    public async joinRoom(roomId, token, character_id):Promise<any> {
        console.log('joinRoom',{ 
            token: token,
            character_id: character_id
        });
        return await this._client.joinById(roomId, { 
            token: token,
            character_id: character_id
        });
        
    }
    

    public async joinChatRoom():Promise<any> {
        return await this._client.joinOrCreate("chat_room");
    }

    public async findCurrentRoom(currentRoomKey):Promise<any> {
        return new Promise(async (resolve: any, reject: any) => {
            let rooms = await this._client.getAvailableRooms("game_room");
            if(rooms.length > 0){
                rooms.forEach((room) => {
                    if(room.metadata.location === currentRoomKey){ 
                        resolve(room);
                    }
                });
            }
            resolve(false);
        });
    }
}