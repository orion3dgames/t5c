import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";

import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";

import {
    ChatBox,
    AbilityBar,
    DebugBox,
    EntitySelectedBar,
    Tooltip,
    InventoryDropdown,
    Panel_Inventory,
    CastingBar,
    ExperienceBar,
    MainMenu,
    RessurectBox,
    DamageText,
    Panel_Abilities,
    Panel_Character,
    Panel_Help,
    Panel_Dialog,
} from "./UI";

import { Room } from "colyseus.js";

import { Entity } from "../Entities/Entity";
import { Player } from "../Entities/Player";
import { Item } from "../Entities/Item";

import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import { Panel } from "./UI/Panels/Panel";
import { GameController } from "./GameController";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { ServerMsg } from "../../shared/types";

export class UserInterface {
    public _game: GameController;
    public _scene: Scene;
    private _engine: Engine;
    public _room: Room;
    private _chatRoom: Room;
    public _entities: (Entity | Player | Item)[];
    private _currentPlayer;
    public _loadedAssets;

    //UI Elements
    public _playerUI;
    private _namesUI;
    public _hightlight;

    // interface
    public _ChatBox: ChatBox;
    private _DebugBox: DebugBox;
    private _AbilityBar: AbilityBar;
    private _targetEntitySelectedBar: EntitySelectedBar;
    private _playerEntitySelectedBar: EntitySelectedBar;
    public _Tooltip: Tooltip;
    private _MainMenu: MainMenu;
    public _CastingBar: CastingBar;
    public _RessurectBox: RessurectBox;
    private _ExperienceBar: ExperienceBar;
    public _InventoryDropdown: InventoryDropdown;
    public _DamageText: DamageText;

    // openable panels
    private _panels: Panel[];
    public panelInventory: Panel_Inventory;
    public panelAbilities: Panel_Abilities;
    public panelCharacter: Panel_Character;
    public panelHelp: Panel_Help;
    public panelDialog: Panel_Dialog;

    // tooltip
    public _UITooltip;

    // labels
    public showingLabels: boolean = false;

    _isDragging;
    _pointerDownPosition;

    constructor(game: GameController, entities: (Entity | Player | Item)[], currentPlayer) {
        // set var we will be needing
        this._game = game;
        this._scene = game.scene;
        this._engine = game.engine;
        this._room = game.currentRoom;
        this._chatRoom = game.currentChat;
        this._entities = entities;
        this._currentPlayer = currentPlayer;
        this._loadedAssets = this._game._loadedAssets;

        // create ui
        const _namesUI = AdvancedDynamicTexture.CreateFullscreenUI("UI_Names", true, this._scene);
        this._namesUI = _namesUI;

        // create ui
        const uiLayer = AdvancedDynamicTexture.CreateFullscreenUI("UI_Player", true, this._scene);
        /*
        uiLayer.idealWidth = 1024;
        uiLayer.idealHeight = 768;
        uiLayer.useSmallestIdeal = true;*/
        this._playerUI = uiLayer;

        // set highlight layer
        this._hightlight = new HighlightLayer("hl", this._scene);
        this._hightlight.blurHorizontalSize = 0.5;
        this._hightlight.blurVerticalSize = 0.5;
        this._hightlight.innerGlow = false;
    }

    public dragging() {
        if (this._isDragging) {
            var deltaX = this._scene.pointerX - this._pointerDownPosition.x;
            var deltaY = this._scene.pointerY - this._pointerDownPosition.y;
            this._isDragging.leftInPixels += deltaX;
            this._isDragging.topInPixels += deltaY;
            this._pointerDownPosition.x = this._scene.pointerX;
            this._pointerDownPosition.y = this._scene.pointerY;
            this._InventoryDropdown.refresh();
        }
    }

    public startDragging(panel) {
        this._isDragging = panel;
        this._pointerDownPosition = { x: this._scene.pointerX, y: this._scene.pointerY };
    }

    public stopDragging() {
        this._isDragging.isPointerBlocker = true;
        this._isDragging = null;
    }

    // set current player
    ////////////////////////////
    public setCurrentPlayer(currentPlayer) {
        // set current player
        this._currentPlayer = currentPlayer;

        // create debug ui + events
        this._DebugBox = new DebugBox(this._playerUI, this._engine, this._scene, this._room, this._currentPlayer, this._entities);

        // create main interface elements
        this._MainMenu = new MainMenu(this, currentPlayer);
        this._CastingBar = new CastingBar(this, currentPlayer);
        this._RessurectBox = new RessurectBox(this, currentPlayer);
        this._ExperienceBar = new ExperienceBar(this, currentPlayer);

        // create abilities ui + events
        this._AbilityBar = new AbilityBar(this, currentPlayer);

        // create chat ui + events
        this._ChatBox = new ChatBox(this._playerUI, this._chatRoom, currentPlayer, this._entities, this._game);

        // create chat ui + events
        this._DamageText = new DamageText(this._namesUI, this._scene, this._entities);

        // create selected entity panel
        this._targetEntitySelectedBar = new EntitySelectedBar(this, {
            panelName: "target",
            currentPlayer: false,
        });
        this._playerEntitySelectedBar = new EntitySelectedBar(this, {
            panelName: "player",
            currentPlayer: currentPlayer,
        });

        // create panel
        this.panelInventory = new Panel_Inventory(this, currentPlayer, {
            name: "Inventory",
            stayOpen: true,
            width: "246px;",
            height: "300px;",
            top: "-30px;",
            left: "-15px;",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_RIGHT,
            vertical_position: Control.VERTICAL_ALIGNMENT_BOTTOM,
        });
        this._InventoryDropdown = new InventoryDropdown(this);

        // create panel
        this.panelAbilities = new Panel_Abilities(this, currentPlayer, {
            name: "Abilities",
            width: "500px;",
            height: "400px;",
            top: "100px;",
            left: "15px;",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_LEFT,
            vertical_position: Control.VERTICAL_ALIGNMENT_TOP,
        });

        // create panel
        this.panelCharacter = new Panel_Character(this, currentPlayer, {
            name: "Character",
            width: "500px;",
            height: "300px;",
            top: "100px;",
            left: "15px;",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_LEFT,
            vertical_position: Control.VERTICAL_ALIGNMENT_TOP,
        });

        // create help panel
        this.panelHelp = new Panel_Help(this, currentPlayer, {
            name: "Help",
            width: "500px;",
            height: "300px;",
            top: "100px;",
            left: "15px;",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_LEFT,
            vertical_position: Control.VERTICAL_ALIGNMENT_TOP,
        });

        // create dialog panel
        this.panelDialog = new Panel_Dialog(this, currentPlayer, {
            name: "Dialog Panel",
            width: "300px;",
            height: "300px;",
            //top: "-100px;",
            //left: "-250px;",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_CENTER,
            vertical_position: Control.VERTICAL_ALIGNMENT_CENTER,
        });

        // open inventory by default
        this.panelInventory.open();

        // create tooltip
        this._Tooltip = new Tooltip(this, currentPlayer);

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {
            this.update();
            this.dragging();
        });

        // initial resize event
        this.resize();
    }

    public resize() {
        if (this._engine.getRenderWidth() < 1100) {
            if (this._ChatBox) {
                this._ChatBox.chatPanel.top = "-115px;";
            }
        } else {
            if (this._ChatBox) {
                this._ChatBox.chatPanel.top = "-30px;";
            }
        }
    }

    public update() {
        //

        if (this._currentPlayer._input.left_alt_pressed === true && this.showingLabels === false) {
            for (let sessionId in this._entities) {
                if (this._entities[sessionId].characterLabel) {
                    this._entities[sessionId].characterLabel.isVisible = true;
                }
            }
            this.showingLabels = true;
        }

        if (this._currentPlayer._input.left_alt_pressed === false && this.showingLabels === true) {
            for (let sessionId in this._entities) {
                if (this._entities[sessionId].characterLabel) {
                    this._entities[sessionId].characterLabel.isVisible = false;
                }
            }
            this.showingLabels = false;
        }

        /*
        // hide entity labels if out of distance
        for (let sessionId in this._entities) {
            let entity = this._entities[sessionId];
            if (entity && entity.mesh && entity.mesh.isEnabled()) {
                entity.characterLabel.isVisible = true;
            } else {
                entity.characterLabel.isVisible = false;
            }
        }*/
    }

    // chatbox label
    public createEntityChatLabel(entity) {
        var rect1 = new Rectangle("player_chat_" + entity.sessionId);
        rect1.isVisible = false;
        rect1.width = "175px";
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

    // entity label
    public createEntityLabel(entity) {
        var rect1 = new Rectangle("player_nameplate_" + entity.sessionId);
        rect1.isVisible = false;
        rect1.width = "300px";
        rect1.height = "40px";
        rect1.thickness = 0;
        rect1.zIndex = this._namesUI.addControl(rect1);
        rect1.linkWithMesh(entity.mesh);
        rect1.linkOffsetY = -80;
        var label = new TextBlock("player_nameplate_text_" + entity.sessionId);
        label.text = entity.name;
        label.color = "white";
        label.fontWeight = "light";
        label.outlineWidth = 5;
        label.outlineColor = "black";
        rect1.addControl(label);
        return rect1;
    }

    // item label
    public createItemLabel(entity) {
        let title = entity.qty > 1 ? entity.title + " X " + entity.qty : entity.title;
        var rect1 = new Rectangle("item_nameplate_" + entity.sessionId);
        rect1.isVisible = false;
        rect1.width = "200px";
        rect1.height = "40px";
        rect1.thickness = 0;
        rect1.zIndex = this._namesUI.addControl(rect1);
        rect1.linkWithMesh(entity.mesh);
        rect1.linkOffsetY = -30;
        var label = new TextBlock("item_nameplate_text_" + entity.sessionId);
        label.text = title;
        label.color = "black";
        label.fontWeight = "bold";
        label.fontSize = "14px";
        label.outlineWidth = 3;
        label.outlineColor = "white";
        rect1.addControl(label);
        return rect1;
    }

    public createInteractableButtons(entity) {
        if (!entity.spwanInfo) return false;

        if (!entity.spwanInfo.interactable) return false;

        var rect1 = new Rectangle("entity_buttons_" + entity.sessionId);
        rect1.isVisible = false;
        rect1.width = "100px";
        rect1.height = "200px";
        rect1.thickness = 0;
        rect1.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        rect1.zIndex = this._namesUI.addControl(rect1);
        rect1.linkWithMesh(entity.mesh);
        rect1.linkOffsetY = -200;

        const rightStackPanel = new StackPanel("rightStackPanel");
        rightStackPanel.left = 0;
        rightStackPanel.top = 0;
        rightStackPanel.width = 1;
        rightStackPanel.height = 1;
        rightStackPanel.spacing = 5;
        rightStackPanel.adaptHeightToChildren = true;
        rightStackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        rightStackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        rightStackPanel.setPaddingInPixels(5, 5, 5, 5);
        rightStackPanel.isVertical = true;
        rect1.addControl(rightStackPanel);

        let interactable = entity.spwanInfo.interactable;

        const createBtn = Button.CreateSimpleButton("characterBtn", interactable.title);
        createBtn.left = "0px;";
        createBtn.top = "0px";
        createBtn.width = 1;
        createBtn.height = "30px";
        createBtn.background = "orange";
        createBtn.color = "white";
        createBtn.thickness = 1;
        createBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        createBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        rightStackPanel.addControl(createBtn);

        createBtn.onPointerDownObservable.add(() => {
            this.panelDialog.open(entity);
        });

        return rect1;
    }
}
