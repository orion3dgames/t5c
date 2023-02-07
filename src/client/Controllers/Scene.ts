import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";

import { Network } from "./Network";
import State from "./../../client/Screens/Screens";

export class SceneController {
    // babylon
    public canvas;
    public scene: Scene;
    public engine: Engine;
    public client: Network;

    // scene management
    public state: number = 0;
    public currentScene;
    public nextScene;

    // custom data
    public currentUser;
    public currentPlayer;
    public currentRoomID;
    public currentSessionID;
    public currentLocation;
    public metaData: any;

    constructor() {
        // default scene
        this.nextScene = State.LOGIN;
    }

    public setMetaData(metaData: any) {}

    static goToScene(newState: State) {
        global.T5C.nextScene = newState;
    }
}
