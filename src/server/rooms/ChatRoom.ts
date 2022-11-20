import {Room, Client} from '@colyseus/core';
import { ChatSchema } from './schema/ChatSchema';

export class ChatRoom extends Room {
    
    public maxClients = 64;
    private utc = new Date().toLocaleString();
    public autoDispose = false;

    // When room is initialized
    onCreate(options: any){
        console.log("ChatRoom created!", options);

        //For chat
        this.onMessage("message", (client, message) => {
            console.log("ChatRoom received message from: ", client.sessionId, ":", message);
            this.broadcast("messages", this.generateMessage(client.sessionId, message));
        });
    }
    
    // When client successfully join the room
    onJoin (client: Client, options: any, auth: any){

    }

    // When a client leaves the room
    onLeave(client: Client, consented: boolean) {
        
    }

    // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
    onDispose() {}

    // prepare chat message to be sent
    generateMessage(sessionId: string, message = "") {
        let msg = new ChatSchema;
        msg.senderID = sessionId;
        msg.message = message;
        return msg;
    }
}