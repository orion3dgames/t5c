import { Room, Client } from "@colyseus/core";
import { ChatSchema } from "./schema/ChatSchema";
import Logger from "../../shared/Logger";

export class ChatRoom extends Room {
    public maxClients = 64;
    public autoDispose = true;

    // When room is initialized
    onCreate(options: any) {
        Logger.info("[chat_room][onCreate] room created.", options);

        //For chat
        this.onMessage("message", (client, message) => {
            Logger.info("[chat_room][message] message received from " + client.sessionId, message);

            this.broadcast("messages", this.generateMessage(client.sessionId, message));
        });
    }

    // When client successfully join the room
    onJoin(client: Client, options: any, auth: any) {
        client.sessionId = options.sessionId;

        Logger.info("[chat_room][message] client joined " + client.sessionId, options);

        // sent initial help message
        client.send(
            "messages",
            this.generateMessage(
                client.sessionId,
                "Welcome to T5C, you can move around by left clicking and dragging the mouse around."
            )
        );
    }

    // When a client leaves the room
    onLeave(client: Client, consented: boolean) {}

    // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
    onDispose() {}

    // prepare chat message to be sent
    generateMessage(sessionId: string, incomingMsg: any) {
        let msg = new ChatSchema();
        msg.senderID = sessionId;
        msg.name = incomingMsg.name;
        msg.message = incomingMsg.message;
        return msg;
    }
}
