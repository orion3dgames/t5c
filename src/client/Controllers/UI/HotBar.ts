import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { Player } from "../../Entities/Player";
import { generatePanel, getBg, getPadding } from "./Theme";
import { GameController } from "../GameController";
import { ServerMsg } from "../../../shared/types";
import { Room } from "colyseus.js";
import { UserInterface } from "../UserInterface";

export class HotBar {
    private _playerUI;
    private _abilityUI;
    private _UI: UserInterface;
    private _room;
    private _game: GameController;
    private _loadedAssets;
    private _currentPlayer: Player;
    private _UITooltip;

    constructor(_UI: UserInterface, _currentPlayer) {
        this._playerUI = _UI._playerUI;
        this._currentPlayer = _currentPlayer;
        this._room = _UI._room;
        this._loadedAssets = _UI._loadedAssets;
        this._game = _UI._game;
        this._UI = _UI;

        // create ui
        this._createUI();

        // add ui events
        let entity = this._currentPlayer.entity;
        entity.player_data.hotbar.onAdd((item, sessionId) => {
            this._createUI();
            // todo: could be a performance issue here?
            // orion to keep an eye on this one
            item.onChange((item, sessionId) => {
                this._createUI();
            });
            item.onRemove((item, sessionId) => {
                this._createUI();
            });
        });
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

        for (let i = 1; i <= this._game.config.PLAYER_HOTBAR_SIZE; i++) {
            // calculate responsive width and height
            let iconGutter = 4;
            let iconWidth = width / this._game.config.PLAYER_HOTBAR_SIZE - iconGutter;
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

        // add hotbar icons
        if (this._currentPlayer.entity.player_data.hotbar) {
            this._currentPlayer.entity.player_data.hotbar.forEach((data) => {
                let hotbarData;
                if (data.type === "item") {
                    hotbarData = this._game.getGameData("item", data.key);
                }
                if (data.type === "ability") {
                    hotbarData = this._game.getGameData("ability", data.key);
                }

                if (hotbarData) {
                    this.addIcon(data.digit, data, hotbarData, abilityRect[data.digit]);
                }
            });
        }
    }

    addIcon(digit, hotbar, hotbarData, headlineRect: Rectangle) {
        var img = new Image("ability_image_" + digit, "./images/icons/" + hotbarData.icon + ".png");
        img.stretch = Image.STRETCH_FILL;
        headlineRect.addControl(img);

        headlineRect.onPointerEnterObservable.add(() => {
            this.showTooltip(hotbar.type, hotbarData, headlineRect);
        });

        headlineRect.onPointerOutObservable.add(() => {
            this.hideTooltip();
        });

        headlineRect.onPointerClickObservable.add(() => {
            if (!this._currentPlayer.abilityController.isCasting) {
                this._game.sendMessage(ServerMsg.PLAYER_HOTBAR_ACTIVATED, {
                    senderId: this._room.sessionId,
                    targetId: this._game?.selectedEntity?.sessionId ?? false,
                    digit: digit,
                });
            }
        });

        // add ability number
        var abilityNumber = new Rectangle("abilityNumber" + digit + "_cooldown");
        abilityNumber.top = "0px";
        abilityNumber.left = "0px";
        abilityNumber.width = "15px";
        abilityNumber.height = "15px;";
        abilityNumber.thickness = 0;
        abilityNumber.isVisible = true;
        abilityNumber.background = "rgba(0,0,0,.7)";
        abilityNumber.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        abilityNumber.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        headlineRect.addControl(abilityNumber);

        var roomTxt = new TextBlock("ability_text_" + digit);
        roomTxt.text = "" + digit;
        roomTxt.fontSize = "12px";
        roomTxt.color = "#FFF";
        roomTxt.fontWeight = "bold";
        roomTxt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        roomTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        abilityNumber.addControl(roomTxt);

        // add cooldown
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

    showTooltip(type, hotbarData, headlineRect) {
        if (type === "item") {
            this._UI._Tooltip.refresh("item", hotbarData, headlineRect, "center", "top");
        }
        if (type === "ability") {
            this._UI._Tooltip.refresh("ability", hotbarData, headlineRect, "center", "top");
        }
    }

    hideTooltip() {
        this._UI._Tooltip.close();
    }
}
