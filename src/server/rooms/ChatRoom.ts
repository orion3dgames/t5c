import { Room, Client } from "@colyseus/core";
import { ChatSchema } from "./schema/ChatSchema";
import Logger from "../utils/Logger";
import { ServerMsg } from "../../shared/types";

export class ChatRoom extends Room {
    public maxClients = 1000;

    // When room is initialized
    onCreate(options: any) {
        Logger.info("[chat_room][onCreate] room created.", options);

        this.autoDispose = true;

        //For chat
        this.onMessage(ServerMsg.PLAYER_SEND_MESSAGE, (client, message) => {
            Logger.info("[chat_room][message] message received from " + client.sessionId, message);

            this.broadcast(ServerMsg.CHAT_MESSAGE, this.generateMessage(message.senderId, message));
        });
    }

    // When client successfully join the room
    onJoin(client: Client, options: any, auth: any) {
        Logger.info("[chat_room][message] client joined " + client.sessionId, options);

        setTimeout(() => {
            this.broadcast(
                ServerMsg.SERVER_MESSAGE,
                this.generateMessage(options.sessionId, {
                    type: "system",
                    name: options.name,
                    message: options.name + " has joined the room.",
                })
            );
        }, 1000);
    }

    // When a client leaves the room
    onLeave(client: Client, consented: boolean) {
        client.leave();
    }

    // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
    onDispose() {}

    // prepare chat message to be sent
    generateMessage(sessionId: string = "system", incomingMsg: any) {
        let msg = new ChatSchema();
        msg.senderID = sessionId;
        msg.name = incomingMsg.name;
        msg.message = incomingMsg.message;
        console.log(sessionId, msg);
        return msg;
    }
}
