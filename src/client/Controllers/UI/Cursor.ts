import { UserInterface } from "../UserInterface";

export class Cursor {
    private _ui: UserInterface;

    private cursors;

    constructor(ui) {
        this._ui = ui;

        this.cursors = {
            buy: "./images/cursor/buy.png",
            sell: "./images/cursor/sell.png",
            talk: "./images/cursor/talk.png",
        };
    }

    activate(type) {
        // does this type exist
        if (this.cursors[type]) {
            return false;
        }

        // show cursor
        //document.body.style.cursor = "url(" + type + "), auto";
        //this._ui._scene.hoverCursor = "url(" + type + "), auto";
        this._ui._scene.hoverCursor = "url(./images/cursor/talk.png), auto";
    }

    desactivate() {
        document.documentElement.style.cursor = "auto";
    }

    hoverCursor(type) {
        if (type === "hover") {
            return "url(./images/cursor/hand_hover.png), auto";
        }
        return "default";
    }
}
