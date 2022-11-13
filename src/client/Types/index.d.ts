import State from "../Screens/Screens";

type PlayerInputs = {
  seq: number,
  h: number,
  v: number,
};

export {
  PlayerInputs
};

declare global {
  interface Window {
    nextScene: State;
    currentRoomID: string;
  }
}