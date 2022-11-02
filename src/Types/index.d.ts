import State from "../Screens/Screens";

export {};

declare global {
  interface Window {
    nextScene: State;
    currentRoomID: string;
  }
}