import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Scene } from "@babylonjs/core/scene";
import { generatePanel, getBg } from "./Theme";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { ServerMsg } from "../../../shared/types";
import { UserInterface } from "../UserInterface";

export class RessurectBox {
    private _UI;
    private _playerUI;
    private _scene: Scene;
    private _game;
    private _currentPlayer;

    // revive panel
    public revivePanel;

    constructor(_UI: UserInterface, _currentPlayer) {
        this._UI = _UI;
        this._playerUI = _UI._playerUI;
        this._game = _UI._game;
        this._currentPlayer = _currentPlayer;
        this._createUI();
    }

    _createUI() {
        // add tooltip
        const revivePanel = new Rectangle("revivePanel");
        revivePanel.top = "0px";
        revivePanel.width = "200px";
        revivePanel.height = "90px;";
        revivePanel.thickness = 1;
        revivePanel.background = getBg();
        revivePanel.isVisible = false;
        revivePanel.isPointerBlocker = true;
        revivePanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        revivePanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._playerUI.addControl(revivePanel);
        this.revivePanel = revivePanel;

        const revivePanelText = new TextBlock("revivePanelText");
        revivePanelText.height = "30px;";
        revivePanelText.text = "You have died.";
        revivePanelText.top = "10px;";
        revivePanelText.left = 0;
        revivePanelText.fontSize = "24px;";
        revivePanelText.color = "white";
        revivePanelText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        revivePanelText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        revivePanelText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        revivePanelText.horizontalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        revivePanel.addControl(revivePanelText);

        const reviveButton = Button.CreateSimpleButton("reviveButton", "RESSURECT");
        reviveButton.top = "-10px;";
        reviveButton.left = "0px;";
        reviveButton.width = "180px;";
        reviveButton.height = "30px";
        reviveButton.color = "white";
        reviveButton.background = "#000";
        reviveButton.thickness = 1;
        reviveButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        reviveButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        revivePanel.addControl(reviveButton);

        reviveButton.onPointerDownObservable.add(() => {
            this._game.sendMessage(ServerMsg.PLAYER_RESSURECT);
        });
    }

    public open() {
        this.revivePanel.isVisible = true;
    }

    public close() {
        this.revivePanel.isVisible = false;
    }
}
