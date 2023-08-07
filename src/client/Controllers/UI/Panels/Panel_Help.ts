import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Panel } from "./Panel";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { applyTheme, createButton } from "../Theme";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";

export class Panel_Help extends Panel {
    // inventory tab
    private panel: Rectangle;
    private attributes;
    private stats;
    private slots;

    private leftPanel: Rectangle;
    private rightPanel: Rectangle;
    private slotPanel: Rectangle;

    constructor(_UI, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);
    }

    // create panel
    private createContent() {
        let panel: Rectangle = this._panelContent;

        // add item qty
        const itemTxtQty = new TextBlock("helpContent");
        itemTxtQty.width = 1;
        itemTxtQty.height = 1;
        itemTxtQty.text = "HELP TEXT HERE...";
        itemTxtQty.color = "#FFF";
        itemTxtQty.top = "10px";
        itemTxtQty.left = "10px";
        itemTxtQty.fontSize = "12px;";
        itemTxtQty.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        itemTxtQty.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        itemTxtQty.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        panel.addControl(itemTxtQty);
    }
}
