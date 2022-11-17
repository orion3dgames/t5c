import { Vector3 } from "@babylonjs/core";
import State from "../Screens/Screens";

type PlayerInputs = {
  seq: number,
  h: number,
  v: number,
};

type PlayerLocation = {
  title: string,
  spawnPoint: Vector3,
};

type PlayerMessage = {
  senderID: string,
  message: string,
  timestamp: number,
  createdAt: string
};

export {
  PlayerInputs,
  PlayerLocation,
  PlayerMessage
};

declare global {
  interface Window {
    nextScene: State;
    currentRoomID: string;
    currentSessionID: string;
    currentLocation: PlayerLocation;
  }
}