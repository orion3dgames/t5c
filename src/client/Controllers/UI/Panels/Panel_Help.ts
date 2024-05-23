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

    private leftPanel: Rectangle;
    private rightPanel: Rectangle;
    private slotPanel: Rectangle;

    constructor(_UI, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);

        let content = {
            chapter1: {
                title: "Welcome",
                description: "Welcome to T5C",
            },
            chapter2: {
                title: "Welcome",
                description: "Welcome to T5C",
            },
        };

        this.createContent();
    }

    // create panel
    private async createContent() {
        let panel: Rectangle = this._panelContent;
        const req = await axios.request({
            method: "get",
            url: apiUrl(this._game.config.port) + "/getHelpPage/?page=index",
        });
        await this.renderHtmlToSvg(req.data);
    }

    async renderHtmlToSvg(html) {
        let img = document.createElement("img");
        img.width = 500;
        img.height = 500;
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${img.width}" height="${img.height}">
        <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">${html}</div>
        </foreignObject>
        </svg>`;

        const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        const svgObjectUrl = URL.createObjectURL(svgBlob);
        img.src = svgObjectUrl;

        var image = new Image("slot_imageeeeeeeeeeee_", img.src);
        image.width = 1;
        image.stretch = Image.STRETCH_UNIFORM;
        image.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        image.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._panelContent.addControl(image);
    }
}
