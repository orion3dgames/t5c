import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Image } from "@babylonjs/gui/2D/controls/image";
import Config from "../../../shared/Config";
import { dataDB } from "../../../shared/Data/dataDB";
import { Player } from "../../../shared/Entities/Player";

export class UI_Abilities {
    private _playerUI;
    private _gameRoom;
    private _loadedAssets;
    private _currentPlayer: Player;
    private _tooltip: Rectangle;
    private _tooltipTxt: TextBlock;
    private abilities;
    private abylity_number: number = 9;

    constructor(_playerUI, _gameRoom, _currentPlayer, _loadedAssets) {
        this._playerUI = _playerUI;
        this._currentPlayer = _currentPlayer;
        this._gameRoom = _gameRoom;
        this._loadedAssets = _loadedAssets;
        this.abilities = dataDB.load("abilities");

        // create ui
        this._createUI();

        // add ui events
        this._createEvents();

        this._createTooltip();
    }

    _createTooltip() {
        let width = 330;

        // add tooltip
        const toolTipPanel = new Rectangle("toolTipPanel");
        toolTipPanel.top = "-200px";
        toolTipPanel.left = 0;
        toolTipPanel.width = width + "px";
        toolTipPanel.adaptHeightToChildren = true;
        toolTipPanel.thickness = 1;
        toolTipPanel.background = Config.UI_CENTER_PANEL_BG;
        toolTipPanel.isVisible = false;
        toolTipPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        toolTipPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._playerUI.addControl(toolTipPanel);
        this._tooltip = toolTipPanel;

        // add tooltip text
        var toolTipText = new TextBlock("toolTipText");
        toolTipText.paddingTop = "5px";
        toolTipText.paddingBottom = "5px";
        toolTipText.paddingRight = "5px";
        toolTipText.paddingLeft = "5px";
        toolTipText.text = "NONE";
        toolTipText.fontSize = "12px";
        toolTipText.color = "#FFF";
        toolTipText.top = "0px";
        toolTipText.left = "0px";
        toolTipText.width = 1;
        toolTipText.textWrapping = TextWrapping.WordWrap;
        toolTipText.resizeToFit = true;
        toolTipText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        toolTipText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        toolTipPanel.addControl(toolTipText);
        this._tooltipTxt = toolTipText;
    }

    _createUI() {
        let width = 330;

        // add stack panel
        const abilityPanel = new Rectangle("abilityPanel");
        abilityPanel.top = "-13px;";
        abilityPanel.width = width + "px";
        abilityPanel.adaptHeightToChildren = true;
        abilityPanel.thickness = 0;
        abilityPanel.background = Config.UI_CENTER_PANEL_BG;
        abilityPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        abilityPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._playerUI.addControl(abilityPanel);

        for (let i = 1; i <= this.abylity_number; i++) {
            // calculate responsive width and height
            let iconWidth = width / this.abylity_number;
            let leftMargin = i > 1 ? (i - 1) * iconWidth + "px" : "0px";

            // container
            var headlineRect = new Rectangle("ability_" + i);
            headlineRect.top = "0px";
            headlineRect.left = leftMargin;
            headlineRect.width = iconWidth + "px";
            headlineRect.height = iconWidth + "px";
            headlineRect.thickness = 1;
            headlineRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            headlineRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            abilityPanel.addControl(headlineRect);

            // add ability icon and events
            this.addAbilityIcon(i, headlineRect);

            // add ability number
            var roomTxt = new TextBlock("ability_text_" + i);
            roomTxt.paddingLeft = "5px";
            roomTxt.text = "" + i;
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
            var abilityCooldown = new Rectangle("ability_" + i + "_cooldown");
            abilityCooldown.top = 0;
            abilityCooldown.left = 0;
            abilityCooldown.width = iconWidth + "px";
            abilityCooldown.height = 0;
            abilityCooldown.thickness = 0;
            abilityCooldown.isVisible = true;
            abilityCooldown.background = "rgba(0,0,0,.7)";
            abilityCooldown.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            abilityCooldown.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            headlineRect.addControl(abilityCooldown);
        }
    }

    addAbilityIcon(digit, headlineRect: Rectangle) {
        let ability = this._currentPlayer.getAbilityByDigit(digit);
        if (ability) {
            var imageData = this._loadedAssets[ability.icon];
            var img = new Image("ability_image_" + digit, imageData);
            img.stretch = Image.STRETCH_FILL;
            headlineRect.addControl(img);

            headlineRect.onPointerEnterObservable.add(() => {
                this.showTooltip(ability);
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
        }
    }

    showTooltip(ability) {
        this._tooltip.isVisible = true;
        this._tooltipTxt.text = ability.description;
    }

    hideTooltip() {
        this._tooltip.isVisible = false;
        this._tooltipTxt.text = "";
    }

    _createEvents() {}
}
