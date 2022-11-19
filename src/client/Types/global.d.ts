import { Vector3 } from "@babylonjs/core";
import State from "../Screens/Screens";

export {};

declare global {

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

    interface T5C {
        nextScene: State;
        currentRoomID: string;
        currentSessionID: string;
        currentLocation: PlayerLocation;
    }

    interface Window {
        nextScene: State;
        currentRoomID: string;
        currentSessionID: string;
        currentLocation: PlayerLocation;
    }

}