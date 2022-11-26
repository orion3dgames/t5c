import { Vector3 } from "@babylonjs/core";
import State from "../../client/Screens/Screens";

export {
    PlayerInputs,
    PlayerLocation,
    PlayerMessage,
};

type PlayerInputs = {
    seq: number,
    h: number,
    v: number,
};
  
type PlayerLocation = {
    title: string,
    mesh: string,
    key: string,
    spawnPoint: Vector3,
};

type PlayerMessage = {
    senderID: string,
    username: string;
    message: string,
    timestamp: number,
    createdAt: string
};

declare global {
    interface T5C {
        nextScene: State;
        currentRoomID: string;
        currentSessionID: string; 
        currentLocation: PlayerLocation;
        currentUser: any;
        currentMs: number;
    }
}