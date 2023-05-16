import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Panel } from "./Panel";

export class Panel_Character extends Panel {
    // inventory tab
    private panel: Rectangle;

    constructor(_UI, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);

        this.createContent();

        // dynamic events
        let entity = this._currentPlayer.entity;
        if (entity) {
        }
    }

    // open panel
    public open() {
        super.open();
        this.refresh();
    }

    // refresh panel
    public update() {
        super.update();
    }

    // create panel
    private createContent() {
        let panel: Rectangle = this._panelContent;

        // if already exists
        panel.children.forEach((el) => {
            el.dispose();
        });

        //
        this.refresh();
    }

    ///////////////////////////////////////
    ///////////////////////////////////////
    // INVENTORY PANEL
    public refresh() {}
}
