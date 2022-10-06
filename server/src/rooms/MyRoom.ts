import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
    maxClients = 5;

    onCreate(options: any) {
        console.log("MyRoom created.");
        this.setState(new MyRoomState());

        // 
        this.onMessage("updatePosition", (client, data) => {
            console.log("update received -> ");
            console.debug(JSON.stringify(data));
            const player = this.state.players.get(client.sessionId);
            player.x = data["x"];
            player.y = data['y'];
            player.z = data["z"];
        });
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined!");

        // create Player instance
        const player = new Player();

        // place Player at a random position in the floor
        const FLOOR_SIZE = 500;
        player.x = -(FLOOR_SIZE/2) + (Math.random() * FLOOR_SIZE);
        player.y = -1;
        player.z = -(FLOOR_SIZE/2) + (Math.random() * FLOOR_SIZE);

        // place player in the map of players by its sessionId
        // (client.sessionId is unique per connection!)
        this.state.players.set(client.sessionId, player);

        console.log("new player =>", player.toJSON());
    }

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);
        console.log(client.sessionId, "left!");
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
}
