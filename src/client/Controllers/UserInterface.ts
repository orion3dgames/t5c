import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color3 } from "@babylonjs/core/Maths/math.color";

import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";

import { UI_Chats, UI_Abilities, UI_Debug, UI_EntitySelected, UI_Panel, UI_Tooltip } from "./UI";

import { Room } from "colyseus.js";
import State from "../Screens/Screens";
import { SceneController } from "../Controllers/Scene";
import { Entity } from "../../shared/Entities/Entity";
import Config from "../../shared/Config";
import { Leveling } from "../../shared/Entities/Player/Leveling";

export class UserInterface {
    private _scene: Scene;
    private _engine: Engine;
    private _gameRoom: Room;
    private _chatRoom: Room;
    public _entities: Entity[];
    private _currentPlayer;
    private _loadedAssets;

    //UI Elements
    public _playerUI;
    private _namesUI;
    private _centerUI;
    public _UIChat: UI_Chats;
    private _UIAbilities: UI_Abilities;
    private _UIDebug: UI_Debug;
    private _UITargetSelected: UI_EntitySelected;
    private _UIPlayerSelected: UI_EntitySelected;
    private _UIPanel: UI_Panel;

    // experience bar
    private experienceBarUI;
    private experienceBarUIText;

    // casting bar
    public _UICastingTimer;
    public _UICastingTimerInside;
    public _UICastingTimerText;

    // tooltip
    public _UITooltip;

    // revive panel
    public revivePanel;

    constructor(scene: Scene, engine: Engine, gameRoom: Room, chatRoom: Room, entities: Entity[], currentPlayer, _loadedAssets) {
        // set var we will be needing
        this._scene = scene;
        this._engine = engine;
        this._gameRoom = gameRoom;
        this._chatRoom = chatRoom;
        this._entities = entities;
        this._currentPlayer = currentPlayer;
        this._loadedAssets = _loadedAssets;

        // create ui
        const _namesUI = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene);
        this._namesUI = _namesUI;
        this._namesUI.idealHeight = 720;

        // create ui
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene);
        this._playerUI = playerUI;
        this._playerUI.idealHeight = 720;

        // center panel
        const centerPanel = new Rectangle("centerPanel");
        centerPanel.top = "0px;";
        centerPanel.height = "170px";
        centerPanel.width = "400px";
        centerPanel.thickness = 0;
        centerPanel.background = Config.UI_CENTER_PANEL_BG;
        centerPanel.alpha = 1;
        centerPanel.isPointerBlocker = true;
        centerPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        centerPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._playerUI.addControl(centerPanel);
        this._centerUI = centerPanel;

        /////////////////////////////////////
        // create interface
        this.createMisc();
        this.experienceBar();
        this.castingBar();
        this.createRevivePanel();

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {
            // refresh
            //this._refreshDebugPanel(debugTextUI);
            this.refreshEntityUI();
        });
    }

    // set current player
    ////////////////////////////
    public setCurrentPlayer(currentPlayer) {
        // set current player
        this._currentPlayer = currentPlayer;

        // create abilities ui + events
        this._UIAbilities = new UI_Abilities(this._centerUI, this._gameRoom, currentPlayer, this._loadedAssets);

        // create chat ui + events
        this._UIChat = new UI_Chats(this._centerUI, this._chatRoom, currentPlayer, this._entities);

        // create debug ui + events
        this._UIDebug = new UI_Debug(this._playerUI, this._engine, this._scene, this._gameRoom, this._currentPlayer, this._entities);

        // create selected entity panel
        this._UITargetSelected = new UI_EntitySelected(this._playerUI, this._scene, {
            position: "RIGHT",
            currentPlayer: false,
        });
        this._UIPlayerSelected = new UI_EntitySelected(this._playerUI, this._scene, {
            position: "LEFT",
            currentPlayer: currentPlayer,
        });

        // create panel
        this._UIPanel = new UI_Panel(this._playerUI, this._scene, currentPlayer, this._loadedAssets);

        // create panel
        this._UITooltip = new UI_Tooltip(this._playerUI, this._engine, this._scene, this._gameRoom, this._currentPlayer);
    }

    public refreshEntityUI() {
        if (this._currentPlayer) {
            let progress = Leveling.getLevelProgress(this._currentPlayer.experience);
            this.experienceBarUI.width = progress / 100;
            this.experienceBarUIText.text = progress + "%";
        }

        /*
        for(let sessionId in this._entities){
            let player = this._entities[sessionId];
            // update player color outline
            let mesh = player.playerMesh.getChildMeshes()[0];
            if(mesh){
                mesh.outlineColor = Color3.FromHexString(getHealthColorFromValue(player.health));
            }
        } */
    }

    public experienceBar() {
        /////////////////////////////////////
        //////////////////// mana bar
        const experienceBar = new Rectangle("experienceBar");
        experienceBar.top = "-2px;";
        experienceBar.left = "0px";
        experienceBar.width = "400px;";
        experienceBar.height = "10px";
        experienceBar.background = Config.UI_CENTER_PANEL_BG;
        experienceBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        experienceBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._playerUI.addControl(experienceBar);

        const experienceBarInside = new Rectangle("experienceBarInside");
        experienceBarInside.top = "0px;";
        experienceBarInside.left = "0px;";
        experienceBarInside.width = "400px;";
        experienceBarInside.thickness = 0;
        experienceBarInside.height = "10px";
        experienceBarInside.background = "violet";
        experienceBarInside.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        experienceBarInside.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        experienceBar.addControl(experienceBarInside);
        this.experienceBarUI = experienceBarInside;

        const experienceBarText = new TextBlock("experienceBarText");
        experienceBarText.text = "0";
        experienceBarText.color = "#FFF";
        experienceBarText.top = "2px";
        experienceBarText.left = "5px";
        experienceBarText.fontSize = "8px;";
        experienceBarText.lineSpacing = "-1px";
        experienceBarText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        experienceBarText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        experienceBarText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        experienceBarText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        experienceBar.addControl(experienceBarText);
        this.experienceBarUIText = experienceBarText;
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

    // create misc stuff
    ////////////////////////////
    public createMisc() {
        const inventoryButton = Button.CreateSimpleButton("inventoryButton", "I");
        inventoryButton.top = "-17px;";
        inventoryButton.left = "-190px;";
        inventoryButton.width = "30px;";
        inventoryButton.height = "30px";
        inventoryButton.color = "white";
        inventoryButton.background = "#000";
        inventoryButton.thickness = 1;
        inventoryButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        inventoryButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._playerUI.addControl(inventoryButton);
        inventoryButton.onPointerDownObservable.add(() => {
            this._UIPanel.open("inventory");
        });

        // add a quit button
        const quitButton = Button.CreateSimpleButton("quitButton", "Q");
        quitButton.top = "-17px;";
        quitButton.left = "190px;";
        quitButton.width = "30px;";
        quitButton.height = "30px";
        quitButton.color = "white";
        quitButton.background = "#000";
        quitButton.thickness = 1;
        quitButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        quitButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._playerUI.addControl(quitButton);

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
}
