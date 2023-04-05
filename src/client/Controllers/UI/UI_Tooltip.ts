import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { countPlayers, roundTo } from "../../../shared/Utils";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Button } from "@babylonjs/gui/2D/controls/button";
import Config from "../../../shared/Config";

export class UI_Tooltip {
    private _playerUI;
    private _engine: Engine;
    private _scene: Scene;
    private _gameRoom;
    private _currentPlayer;
    private _entities;
    private ping: number = 0;
    private _debugTextUI;

    private tooltip_container;
    private tooltip_image;
    private tooltip_name;
    private tooltip_description;

    constructor(_playerUI, _engine: Engine, _scene: Scene, _gameRoom, _currentPlayer) {
        this._playerUI = _playerUI;
        this._engine = _engine;
        this._scene = _scene;
        this._gameRoom = _gameRoom;
        this._currentPlayer = _currentPlayer;

        this._createUI();

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {
            // refresh
            this._update();
        });
    }

    _createUI() {
        const tooltipBar = new Rectangle("tooltipBar");
        tooltipBar.top = "0x";
        tooltipBar.width = "150px";
        tooltipBar.height = "150px";
        tooltipBar.thickness = 1;
        tooltipBar.background = Config.UI_CENTER_PANEL_BG;
        tooltipBar.isVisible = true;
        tooltipBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        tooltipBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._playerUI.addControl(tooltipBar);
        this.tooltip_container = tooltipBar;
    }

    generateItem(data) {
        /*
        const text = new TextBlock("debugText");
        debugText.color = "#FFF";
        debugText.top = "5px"; 
        debugText.left = "5px";
        debugText.fontSize = "12px;";
        debugText.resizeToFit = true;
        debugText.text = "TEXT";
        debugText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        debugText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        debugText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        debugText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.tooltipBar.addControl(debugText);*/
    }

    /** called externally to refresh tooltip with content */
    refresh(type, data) {
        switch (type) {
            case "item":
                this.generateItem(data);
                break;
        }
    }

    // debug panel refresh
    private _update() {}
}
