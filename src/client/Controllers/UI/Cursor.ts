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

    activate(type?: string) {
        document.documentElement.style.cursor = this.get(type);
    }

    get(type?: string) {
        if (type === "hover") {
            return "url(./images/cursor/hand_hover.png), auto";
        }
        if (type === "buy") {
            return "url(./images/cursor/buy.png), auto";
        }
        if (type === "sell") {
            return "url(./images/cursor/sell.png), auto";
        }
        return "url(./images/cursor/hand.png), auto";
    }
}
