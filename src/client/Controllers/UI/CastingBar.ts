import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { getBg } from "./Theme";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";

export class CastingBar {
    private _UI;
    private _playerUI;
    private _currentPlayer;

    // casting bar
    public _UICastingTimer;
    public _UICastingTimerInside;
    public _UICastingTimerText;

    constructor(_UI, _currentPlayer) {
        this._UI = _UI;
        this._playerUI = _UI._playerUI;
        this._currentPlayer = _currentPlayer;
        this._createUI();
    }

    _createUI() {
        // add casting bar
        const castingBar = new Rectangle("castingBar");
        castingBar.top = "-75px";
        castingBar.width = "150px";
        castingBar.height = "17px";
        castingBar.thickness = 1;
        castingBar.background = getBg();
        castingBar.isVisible = false;
        castingBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        castingBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._playerUI.addControl(castingBar);
        this._UICastingTimer = castingBar;

        const castingBarInside = new Rectangle("castingBarInside");
        castingBarInside.top = "0px";
        castingBarInside.width = 1;
        castingBarInside.height = 1;
        castingBarInside.background = "rgba(255,255,255,0.5)";
        castingBarInside.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        castingBarInside.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        castingBar.addControl(castingBarInside);
        this._UICastingTimerInside = castingBarInside;

        const castingTimer = new TextBlock("castingTimer");
        castingTimer.text = "0";
        castingTimer.color = "#FFF";
        castingTimer.top = 0;
        castingTimer.left = 0;
        castingTimer.fontSize = "11px;";
        castingTimer.color = "black;";
        castingTimer.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        castingTimer.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        castingTimer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        castingTimer.horizontalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        castingBar.addControl(castingTimer);
        this._UICastingTimerText = castingTimer;
    }

    public update(text, width) {
        this._UICastingTimerText.text = text;
        this._UICastingTimerInside.width = width;
    }

    public open() {
        this._UICastingTimer.isVisible = true;
        this._UICastingTimerText.text = "Start Casting";
    }

    public close() {
        this._UICastingTimer.isVisible = false;
        this._UICastingTimerText.text = "";
    }
}
