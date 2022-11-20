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
    message: string,
    timestamp: number,
    createdAt: string
};

declare global {
    interface Window {
        nextScene: State;
        currentRoomID: string;
        currentSessionID: string; 
        currentLocation: PlayerLocation;
        currentUser: any
    }
}


declare global {
    interface T5C {
        nextScene: State;
        currentRoomID: string;
        currentSessionID: string; 
        currentLocation: PlayerLocation;
        currentUser: any
    }
}