import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { Panel } from "./Panel";
import { apiUrl } from "../../../Utils";
import axios from "axios";
import { Control } from "@babylonjs/gui/2D/controls/control";

export class Panel_Help extends Panel {
    private panel: Rectangle;
    private attributes;
    private stats;
    private slots;
    private helpData;

    private leftPanel: Rectangle;
    private rightPanel: Rectangle;
    private slotPanel: Rectangle;

    constructor(_UI, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);

        this.helpData = this._game.loadGameData("help");

        this.createContent();
    }

    // create panel
    private async createContent() {}
}
