import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Image } from "@babylonjs/gui/2D/controls/image";
import Config from "../../../shared/Config";
import { dataDB } from "../../../shared/Data/dataDB";
import { Player } from "../../../shared/Entities/Player";
import { Ability } from "../../../shared/Data/AbilitiesDB";
import { generatePanel, getBg, getPadding } from "./Theme";

export class AbilityBar {
    private _playerUI;
    private _abilityUI;
    private _UI;
    private _gameRoom;
    private _loadedAssets;
    private _currentPlayer: Player;
    private _UITooltip;
    private abylity_number: number = 9;

    constructor(_UI, _currentPlayer) {
        this._playerUI = _UI._playerUI;
        this._currentPlayer = _currentPlayer;
        this._gameRoom = _UI._gameRoom;
        this._loadedAssets = _UI._loadedAssets;
        this._UI = _UI;
        // create ui
        this._createUI();

        // add ui events
        this._createEvents();
    }

    _createUI() {
        let width = 460;
        let abilityRect: Rectangle[] = [];

        if (this._abilityUI) {
            this._abilityUI.dispose();
        }

        const abilityMainPanel = generatePanel("abilityPanel", "470px;", "62px", "-35px", "0px");
        abilityMainPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        abilityMainPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        abilityMainPanel.isPointerBlocker = true;
        this._playerUI.addControl(abilityMainPanel);

        const paddingPanel = new Rectangle("paddingPanel");
        paddingPanel.width = 1;
        paddingPanel.height = 1;
        paddingPanel.thickness = 0;
        paddingPanel.setPaddingInPixels(getPadding());
        abilityMainPanel.addControl(paddingPanel);
        this._abilityUI = abilityMainPanel;

        // add stack panel
        const abilityPanel = new Rectangle("abilityPanel");
        abilityPanel.top = "0px;";
        abilityPanel.width = width + "px";
        abilityPanel.adaptHeightToChildren = true;
        abilityPanel.thickness = 0;
        abilityPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        abilityPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        paddingPanel.addControl(abilityPanel);

        for (let i = 1; i <= this.abylity_number; i++) {
            // calculate responsive width and height
            let iconGutter = 4;
            let iconWidth = width / this.abylity_number - iconGutter;
            let iconLeft = iconWidth + iconGutter;
            let leftMargin = i > 1 ? (i - 1) * iconLeft + "px" : "0px";

            // container
            var headlineRect = new Rectangle("ability_" + i);
            headlineRect.top = "0px";
            headlineRect.left = leftMargin;
            headlineRect.width = iconWidth + "px";
            headlineRect.height = iconWidth + "px";
            headlineRect.thickness = 0;
            headlineRect.background = "rgba(255,255,255,.2)";
            headlineRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            headlineRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            abilityPanel.addControl(headlineRect);

            abilityRect[i] = headlineRect;
        }

        // add learned abilities
        if (this._currentPlayer.abilities) {
            this._currentPlayer.abilities.forEach((data) => {
                let ability = dataDB.get("ability", data.key);
                if (ability) {
                    this.addAbilityIcon(data.digit, ability, abilityRect[data.digit]);
                }
            });
        }
    }

    addAbilityIcon(digit, ability, headlineRect: Rectangle) {
        var imageData = this._loadedAssets[ability.icon];
        var img = new Image("ability_image_" + digit, imageData);
        img.stretch = Image.STRETCH_FILL;
        headlineRect.addControl(img);

        headlineRect.onPointerEnterObservable.add(() => {
            this.showTooltip(ability, headlineRect, );
        });

        headlineRect.onPointerOutObservable.add(() => {
            this.hideTooltip();
        });

        headlineRect.onPointerClickObservable.add(() => {
            let entity = global.T5C.selectedEntity;
            if (entity && !this._currentPlayer.isCasting) {
                this._gameRoom.send("entity_ability_key", {
                    senderId: this._gameRoom.sessionId,
                    targetId: entity.sessionId,
                    digit: digit,
                });
            }
        });

        // add ability number
        var roomTxt = new TextBlock("ability_text_" + digit);
        roomTxt.paddingLeft = "5px";
        roomTxt.text = "" + digit;
        roomTxt.fontSize = "12px";
        roomTxt.color = "#FFF";
        roomTxt.top = "5px";
        roomTxt.left = "0px";
        roomTxt.width = "20px";
        roomTxt.height = "15px";
        roomTxt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        roomTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        headlineRect.addControl(roomTxt);

        // add cooldown
        // container
        var abilityCooldown = new Rectangle("ability_" + digit + "_cooldown");
        abilityCooldown.top = 0;
        abilityCooldown.left = 0;
        abilityCooldown.width = 1;
        abilityCooldown.height = 0;
        abilityCooldown.thickness = 0;
        abilityCooldown.isVisible = true;
        abilityCooldown.zIndex = 1;
        abilityCooldown.background = "rgba(0,0,0,.7)";
        abilityCooldown.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        abilityCooldown.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        headlineRect.addControl(abilityCooldown);
    }

    showTooltip(ability, headlineRect) {
        this._UI._Tooltip.refresh("ability", ability, headlineRect, "center", "top");
    }

    hideTooltip() {
        this._UI._Tooltip.close();
    }

    _createEvents() {
        let entity = this._currentPlayer.entity;
        if (entity.abilities) {
            entity.abilities.onAdd((item, sessionId) => {
                this._createUI();
            });
            entity.abilities.onRemove((item, sessionId) => {
                this._createUI();
            });
        }
    }
}
