import State from "../../../client/Screens/Screens";
import Config from "../../Config";

export class PlayerActions {

    constructor() {

    }

    public async processAction(action, actionData) {
        switch(action){
            case 'attack':
                this.attack(actionData);
                break;
            case 'warp':
                this.attack(actionData);
                break;
            case 'teleport':
                await this.teleport(actionData);
                break;
        }
    }

    private attack(actionData) {
        actionData.ui.addChatMessage({
            senderID: "SYSTEM",
            message: actionData.data.message,
            name: "SYSTEM",
            timestamp: 0,
            createdAt: ""
        });
    }

    public async teleport(actionData) {
        await actionData.room.leave();
        global.T5C.currentLocation = Config.locations[actionData.location];
        global.T5C.currentCharacter.location = actionData.location;
        global.T5C.nextScene = State.GAME;
    }

}