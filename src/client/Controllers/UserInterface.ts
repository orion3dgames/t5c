import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color3 } from "@babylonjs/core/Maths/math.color";

import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";

import { UI_Chats, UI_Abilities, UI_Debug, UI_EntitySelected, UI_Tooltip, Panel_Inventory, Panel_Abilities, Panel_Character } from "./UI";

import { Room } from "colyseus.js";
import State from "../Screens/Screens";
import { SceneController } from "../Controllers/Scene";
import Config from "../../shared/Config";
import { Leveling } from "../../shared/Entities/Player/Leveling";

import { Entity } from "../../shared/Entities/Entity";
import { Player } from "../../shared/Entities/Player";
import { Item } from "../../shared/Entities/Item";

import { generatePanel, getBg } from "./UI/UI_Theme";
import { Grid, StackPanel } from "@babylonjs/gui";

export class UserInterface {
    private _scene: Scene;
    private _engine: Engine;
    private _gameRoom: Room;
    private _chatRoom: Room;
    public _entities: (Entity | Player | Item)[];
    private _currentPlayer;
    private _loadedAssets;

    //UI Elements
    public _playerUI;
    private _namesUI;
    private _centerUI;

    // interface
    public _UIChat: UI_Chats;
    private _UIDebug: UI_Debug;
    private _UIAbilities: UI_Abilities;
    private _UITargetSelected: UI_EntitySelected;
    private _UIPlayerSelected: UI_EntitySelected;

    // openable panels
    private panelInventory: Panel_Inventory;
    private panelAbilities: Panel_Abilities;
    private panelCharacter: Panel_Character;

    // experience bar
    private experienceBarUI;
    private experienceBarTextLeft;
    private experienceBarTextRight;

    // casting bar
    public _UICastingTimer;
    public _UICastingTimerInside;
    public _UICastingTimerText;

    // tooltip
    public _UITooltip;

    // revive panel
    public revivePanel;

    constructor(scene: Scene, engine: Engine, gameRoom: Room, chatRoom: Room, entities: (Entity | Player | Item)[], currentPlayer, _loadedAssets) {
        // set var we will be needing
        this._scene = scene;
        this._engine = engine;
        this._gameRoom = gameRoom;
        this._chatRoom = chatRoom;
        this._entities = entities;
        this._currentPlayer = currentPlayer;
        this._loadedAssets = _loadedAssets;

        // create ui
        const _namesUI = AdvancedDynamicTexture.CreateFullscreenUI("UI_Names", true, this._scene);
        this._namesUI = _namesUI;

        // create ui
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI_Player", true, this._scene);
        this._playerUI = playerUI;

        /////////////////////////////////////
        // create interface
        this.createMisc();
        this.experienceBar();
        this.castingBar();
        this.createRevivePanel();
    }

    // set current player
    ////////////////////////////
    public setCurrentPlayer(currentPlayer) {
        // set current player
        this._currentPlayer = currentPlayer;

        // create abilities ui + events
        this._UIAbilities = new UI_Abilities(this, currentPlayer);

        // create chat ui + events
        this._UIChat = new UI_Chats(this._playerUI, this._chatRoom, currentPlayer, this._entities);

        // create debug ui + events
        this._UIDebug = new UI_Debug(this._playerUI, this._engine, this._scene, this._gameRoom, this._currentPlayer, this._entities);

        // create selected entity panel
        this._UITargetSelected = new UI_EntitySelected(this._playerUI, this._scene, {
            panelName: "target",
            currentPlayer: false,
        });
        this._UIPlayerSelected = new UI_EntitySelected(this._playerUI, this._scene, {
            panelName: "player",
            currentPlayer: currentPlayer,
        });

        // create panel
        this.panelInventory = new Panel_Inventory(this, currentPlayer, {
            name: "Inventory",
            width: "246px;",
            height: "300px;",
            top: "-30px;",
            left: "-15px;",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_RIGHT,
            vertical_position: Control.VERTICAL_ALIGNMENT_BOTTOM,
        });

        // create tooltip
        this._UITooltip = new UI_Tooltip(this, currentPlayer);

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {
            this.refreshEntityUI();
        });
    }

    public refreshEntityUI() {
        // update level text
        if (this._currentPlayer) {
            let player_experience = this._currentPlayer.player_data.experience;
            let progress = Leveling.getLevelProgress(player_experience);
            this.experienceBarUI.width = progress / 100;
            this.experienceBarTextRight.text = progress + "%";
            this.experienceBarTextLeft.text =
                player_experience.toLocaleString() + " / " + Leveling.getTotalLevelXp(this._currentPlayer.level).toLocaleString() + " EXP";
        }

        // hide entity labels if out of distance
        for (let sessionId in this._entities) {
            let entity = this._entities[sessionId];
            if (entity && entity.mesh && entity.mesh.isEnabled()) {
                entity.characterLabel.isVisible = true;
            } else {
                entity.characterLabel.isVisible = false;
            }
        }
    }

    public experienceBar() {
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
                expBar.width = "2px";
                expBar.height = "22px";
                expBar.thickness = 0;
                expBar.background = "white";
                expBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
                expBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                experienceBar.addControl(expBar);
            }
        }
    }

    public castingBar() {
        // add casting bar
        const castingBar = new Rectangle("castingBar");
        castingBar.top = "-75px";
        castingBar.width = "150px";
        castingBar.height = "17px";
        castingBar.thickness = 1;
        castingBar.background = Config.UI_CENTER_PANEL_BG;
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

    public createRevivePanel() {
        // add tooltip
        const revivePanel = new Rectangle("revivePanel");
        revivePanel.top = "0px";
        revivePanel.width = "200px";
        revivePanel.height = "90px;";
        revivePanel.thickness = 1;
        revivePanel.background = Config.UI_CENTER_PANEL_BG;
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
            this._gameRoom.send("revive_pressed");
        });
    }

    public openTab() {}

    // create misc stuff
    ////////////////////////////
    public createMisc() {
        const grid = new Grid("griddddd");
        grid.top = "-110px";
        grid.width = "460px";
        grid.height = "36px;";
        grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        grid.addColumnDefinition(100, true);
        grid.addColumnDefinition(100, true);
        grid.addColumnDefinition(100, true);
        grid.addColumnDefinition(100, true);
        this._playerUI.addControl(grid);

        ///
        const inventoryButton = Button.CreateSimpleButton("inventoryButton", "Inventory");
        inventoryButton.top = "0;";
        inventoryButton.left = "0px;";
        inventoryButton.width = "100px";
        inventoryButton.height = "30px";
        inventoryButton.color = "white";
        inventoryButton.background = getBg();
        inventoryButton.thickness = 1;
        inventoryButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        grid.addControl(inventoryButton, 0, 0);

        inventoryButton.onPointerDownObservable.add(() => {
            this.openTab();
        });

        //reset position button
        const resetButton = Button.CreateSimpleButton("resetButton", "Unstuck");
        resetButton.top = "0px;";
        resetButton.left = "0px;";
        resetButton.width = "100px;";
        resetButton.height = "30px";
        resetButton.color = "white";
        resetButton.background = getBg();
        resetButton.thickness = 1;
        resetButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        grid.addControl(resetButton, 0, 2);
        resetButton.onPointerDownObservable.add(() => {
            this._gameRoom.send("reset_position");
        });

        // add a quit button
        const quitButton = Button.CreateSimpleButton("quitButton", "Quit");
        quitButton.top = "0px;";
        quitButton.left = "0px;";
        quitButton.width = "100px;";
        quitButton.height = "30px";
        quitButton.color = "white";
        quitButton.background = getBg();
        quitButton.thickness = 1;
        quitButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        grid.addControl(quitButton, 0, 3);

        quitButton.onPointerDownObservable.add(() => {
            this._gameRoom.leave();
            SceneController.goToScene(State.CHARACTER_SELECTION);
        });
    }

    public createEntityChatLabel(entity) {
        var rect1 = new Rectangle("player_chat_" + entity.sessionId);
        rect1.isVisible = false;
        rect1.width = "100px";
        rect1.adaptHeightToChildren = true;
        rect1.thickness = 1;
        rect1.cornerRadius = 5;
        rect1.background = "rgba(0,0,0,.5)";
        rect1.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._namesUI.addControl(rect1);
        rect1.linkWithMesh(entity.mesh);
        rect1.linkOffsetY = -130;

        var label = new TextBlock("player_chat_label_" + entity.sessionId);
        label.text = entity.name;
        label.color = "white";
        label.paddingLeft = "5px;";
        label.paddingTop = "5px";
        label.paddingBottom = "5px";
        label.paddingRight = "5px";
        label.textWrapping = TextWrapping.WordWrap;
        label.resizeToFit = true;
        rect1.addControl(label);

        return rect1;
    }

    // obsolete, keeping just in case
    public createEntityLabel(entity) {
        var rect1 = new Rectangle("player_nameplate_" + entity.sessionId);
        rect1.isVisible = true;
        rect1.width = "200px";
        rect1.height = "40px";
        rect1.thickness = 0;
        rect1.zIndex = this._namesUI.addControl(rect1);
        rect1.linkWithMesh(entity.mesh);
        rect1.linkOffsetY = -100;
        var label = new TextBlock("player_nameplate_text_" + entity.sessionId);
        label.text = entity.name;
        label.color = "blue";
        label.fontWeight = "bold";
        rect1.addControl(label);
        return rect1;
    }

    // obsolete, keeping just in case
    public createItemLabel(entity) {
        var rect1 = new Rectangle("player_nameplate_" + entity.sessionId);
        rect1.isVisible = true;
        rect1.width = "200px";
        rect1.height = "40px";
        rect1.thickness = 0;
        rect1.zIndex = this._namesUI.addControl(rect1);
        rect1.linkWithMesh(entity.mesh);
        rect1.linkOffsetY = -30;
        var label = new TextBlock("player_nameplate_text_" + entity.sessionId);
        label.text = entity.name;
        label.color = "black";
        label.fontWeight = "bold";
        label.fontSize = "14px";
        rect1.addControl(label);
        return rect1;
    }
}
