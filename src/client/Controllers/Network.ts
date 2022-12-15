import { Scene } from '@babylonjs/core';

// colyseus
import { Client, Room } from "colyseus.js";
import { isLocal } from "../../shared/Utils";
import Config from '../../shared/Config';

export class Network {

    public _client;
    public _scene;

    constructor(scene: Scene) {

        this._scene = scene;

        // create colyseus client
        // this should use environement values
        if (isLocal()) {
            this._client = new Client(Config.serverUrlLocal); // local
        }else{
            this._client = new Client(Config.serverUrlProduction); // online
        }   
    }

    public async joinRoom(roomId, token, character_id):Promise<any> {
        return await this._client.joinById(roomId, { 
            token: token,
            character_id: character_id
        });
        
    }
    

    public async joinChatRoom(data):Promise<any> {
        return await this._client.joinOrCreate("chat_room", data);
    }

    public async findCurrentRoom(currentRoomKey):Promise<any> {
        
        return new Promise(async (resolve: any, reject: any) => {
            
            let rooms = await this._client.getAvailableRooms("game_room");
            console.log(rooms);
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