import { Scene } from "@babylonjs/core";
import { Rectangle, TextBlock } from "@babylonjs/gui";
import State from "../../../client/Screens/Screens";
import Config from "../../Config";

export class PlayerUtils {

    private _scene: Scene;
    private _room;

    constructor(scene: Scene, room) {
        this._scene = scene;
        this._room = room;
    }

    // teleport player
    public teleport(location){
        this._room.leave();
        global.T5C.currentLocation = Config.locations[location];
        global.T5C.currentLocationKey = location;
        global.T5C.currentCharacter.location = location;
        global.T5C.currentRoomID = "";
        global.T5C.nextScene = State.GAME;
    }

    public addLabel(mesh, ui, text) {

        var rect1 = new Rectangle();
        rect1.width = "100px";
        rect1.height = "40px";
        rect1.cornerRadius = 20;
        rect1.color = "white";
        rect1.thickness = 4;
        rect1.background = "black";
        ui._playerUI.addControl(rect1);
        rect1.linkWithMesh(mesh);
        rect1.linkOffsetY = -150;

        var label = new TextBlock();
        label.text = text;
        rect1.addControl(label);

        return rect1;

    }

}