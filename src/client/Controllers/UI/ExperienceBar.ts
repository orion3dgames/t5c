import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { getBg } from "./Theme";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Leveling } from "../../../shared/Class/Leveling";

export class ExperienceBar {
    private _UI;
    private _playerUI;
    private _engine: Engine;
    private _scene: Scene;
    private _room;
    private _currentPlayer;

    // experience bar
    private experienceBarUI;
    private experienceBarTextLeft;
    private experienceBarTextRight;

    constructor(_UI, _currentPlayer) {
        this._UI = _UI;
        this._playerUI = _UI._playerUI;
        this._currentPlayer = _currentPlayer;
        this._scene = _UI._scene;

        this._createUI();

        // some ui must be refreshed as things change
        let entity = this._currentPlayer.entity;
        if (entity && entity.player_data) {
            entity.player_data.onChange((item, sessionId) => {
                this.update();
            });
        }
    }

    _createUI() {
        /////////////////////////////////////
        //////////////////// mana bar
        const experienceBar = new Rectangle("experienceBar");
        experienceBar.top = "2px;";
        experienceBar.left = "0px";
        experienceBar.width = 1;
        experienceBar.height = "20px";
        experienceBar.thickness = 2;
        experienceBar.color = "rgba(0,0,0,1)";
        experienceBar.background = getBg();
        experienceBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        experienceBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._playerUI.addControl(experienceBar);

        const experienceBarInside = new Rectangle("experienceBarInside");
        experienceBarInside.top = "0px;";
        experienceBarInside.left = "0px;";
        experienceBarInside.width = "400px;";
        experienceBarInside.thickness = 0;
        experienceBarInside.height = "20px";
        experienceBarInside.background = "violet";
        experienceBarInside.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        experienceBarInside.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        experienceBar.addControl(experienceBarInside);
        this.experienceBarUI = experienceBarInside;

        const experienceBarTextRight = new TextBlock("experienceBarTextRight");
        experienceBarTextRight.text = "0";
        experienceBarTextRight.color = "#FFF";
        experienceBarTextRight.top = "0px";
        experienceBarTextRight.left = "-5px";
        experienceBarTextRight.fontSize = "11px;";
        experienceBarTextRight.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        experienceBarTextRight.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        experienceBarTextRight.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        experienceBarTextRight.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        experienceBar.addControl(experienceBarTextRight);
        this.experienceBarTextRight = experienceBarTextRight;

        const experienceBarTextLeft = new TextBlock("experienceBarTextLeft");
        experienceBarTextLeft.text = "0";
        experienceBarTextLeft.color = "#FFF";
        experienceBarTextLeft.top = "1px";
        experienceBarTextLeft.left = "5px";
        experienceBarTextLeft.fontSize = "11px;";
        experienceBarTextLeft.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        experienceBarTextLeft.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        experienceBarTextLeft.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        experienceBarTextLeft.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        experienceBar.addControl(experienceBarTextLeft);
        this.experienceBarTextLeft = experienceBarTextLeft;

        // bars
        for (let i = 0; i <= 9; i++) {
            if (i !== 0) {
                let expBar = new Rectangle("expBar" + i);
                expBar.top = 0;
                expBar.left = 0.1 * i * 100 + "%";
                expBar.top = "6px";
                expBar.width = "1px";
                expBar.height = "22px";
                expBar.thickness = 0;
                expBar.background = "rgba(255,255,255,.4)";
                expBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
                expBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                experienceBar.addControl(expBar);
            }
        }
    }

    public update() {
        if (this._currentPlayer) {
            let player_experience = this._currentPlayer.player_data.experience;
            let progress = Leveling.getLevelProgress(player_experience);
            this.experienceBarUI.width = progress / 100;
            this.experienceBarTextRight.text = progress + "%";
            this.experienceBarTextLeft.text =
                player_experience.toLocaleString() + " / " + Leveling.getTotalLevelXp(this._currentPlayer.level).toLocaleString() + " EXP";
        }
    }
}
