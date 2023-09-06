import State from "./../../client/Screens/Screens";

export class SceneController {
    constructor() {}

    static goToScene(newState: State) {
        global.T5C.nextScene = newState;
    }
}
