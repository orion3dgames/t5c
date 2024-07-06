import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";

import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";

import {
    ChatBox,
    HotBar,
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
    Panel_Quests,
    Cursor,
    Watermark,
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
    public _engine: Engine;
    public _room: Room;
    private _chatRoom: Room;
    public _entities: Map<string, Player | Entity | Item>;
    private _currentPlayer;
    public _loadedAssets;

    //UI Elements
    public MAIN_ADT: AdvancedDynamicTexture;
    public LABELS_ADT: AdvancedDynamicTexture;
    public _playerUI;
    public _labelsUI;
    public _hightlight;

    // interface
    public _ChatBox: ChatBox;
    public _DebugBox: DebugBox;
    private _HotBar: HotBar;
    public _targetEntitySelectedBar: EntitySelectedBar;
    public _playerEntitySelectedBar: EntitySelectedBar;
    public _Tooltip: Tooltip;
    public _MainMenu: MainMenu;
    public _CastingBar: CastingBar;
    public _RessurectBox: RessurectBox;
    private _ExperienceBar: ExperienceBar;
    public _InventoryDropdown: InventoryDropdown;
    public _DamageText: DamageText;
    public _Cursor: Cursor;
    public _Watermark: Watermark;

    // openable panels
    private _panels: Panel[];
    public panelInventory: Panel_Inventory;
    public panelAbilities: Panel_Abilities;
    public panelCharacter: Panel_Character;
    public panelHelp: Panel_Help;
    public panelDialog: Panel_Dialog;
    public panelQuests: Panel_Quests;

    // tooltip
    public _UITooltip;

    // labels
    public showingLabels: boolean = false;

    // debug
    public fpsPanel;

    _isDragging;
    _pointerDownPosition;

    constructor(game: GameController, entities: Map<string, Player | Entity | Item>, currentPlayer) {
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
        const LABELS_ADT = AdvancedDynamicTexture.CreateFullscreenUI("UI_Names", true, this._scene);
        this.LABELS_ADT = LABELS_ADT;

        // create ui
        const uiLayer = AdvancedDynamicTexture.CreateFullscreenUI("UI_Player", true, this._scene);
        uiLayer.renderScale = 1;
        this.MAIN_ADT = uiLayer;

        //
        const uiLayerContainer = new Rectangle("uiLayerContainer");
        uiLayerContainer.width = 1;
        uiLayerContainer.height = 1;
        uiLayerContainer.thickness = 0;
        uiLayerContainer.fontFamily = "Arial, sans-serif";
        uiLayerContainer.fontSize = "14px;";
        uiLayer.addControl(uiLayerContainer);

        this._playerUI = uiLayerContainer;
    }

    // set current player
    ////////////////////////////
    public setCurrentPlayer(currentPlayer) {
        // set current player
        this._currentPlayer = currentPlayer;

        // cursor
        this._Cursor = new Cursor(this);
        this._Watermark = new Watermark(this);

        // create debug ui + events
        this._DebugBox = new DebugBox(this._playerUI, this._engine, this._scene, this._room, this._currentPlayer, this._entities);

        // create main interface elements
        this._MainMenu = new MainMenu(this, currentPlayer);
        this._CastingBar = new CastingBar(this, currentPlayer);
        this._RessurectBox = new RessurectBox(this, currentPlayer);
        this._ExperienceBar = new ExperienceBar(this, currentPlayer);

        // create hotbar and events
        this._HotBar = new HotBar(this, currentPlayer);

        // create chat ui + events
        this._ChatBox = new ChatBox(this._playerUI, this._chatRoom, currentPlayer, this._entities, this._game);

        // create selected entity panel
        this._targetEntitySelectedBar = new EntitySelectedBar(this, {
            panelName: "target",
            currentPlayer: false,
        });
        this._playerEntitySelectedBar = new EntitySelectedBar(this, {
            panelName: "player",
            currentPlayer: currentPlayer,
        });
        this._playerEntitySelectedBar.setTarget(currentPlayer);

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
            top: "-50px;",
            left: "0px;",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_CENTER,
            vertical_position: Control.VERTICAL_ALIGNMENT_CENTER,
        });

        // create panel
        this.panelCharacter = new Panel_Character(this, currentPlayer, {
            name: "Character",
            width: "600px;",
            height: "320px;",
            top: "-50px;",
            left: "0px;",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_CENTER,
            vertical_position: Control.VERTICAL_ALIGNMENT_CENTER,
        });

        // create help panel
        this.panelHelp = new Panel_Help(this, currentPlayer, {
            name: "Welcome to T5C",
            width: "500px;",
            height: "500px;",
            top: "-50px;",
            left: "0px;",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_CENTER,
            vertical_position: Control.VERTICAL_ALIGNMENT_CENTER,
        });

        // create dialog panel
        this.panelDialog = new Panel_Dialog(this, currentPlayer, {
            name: "Dialog Panel",
            width: "350px;",
            height: "400px;",
            top: "-50px;",
            left: "0px;",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_CENTER,
            vertical_position: Control.VERTICAL_ALIGNMENT_CENTER,
        });

        // create quests panel
        this.panelQuests = new Panel_Quests(this, currentPlayer, {
            name: "Active Quests",
            width: "300px;",
            height: "300px;",
            top: "-50px;",
            left: "0px;",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_CENTER,
            vertical_position: Control.VERTICAL_ALIGNMENT_CENTER,
        });

        // open inventory by default
        this.panelInventory.open();
        //this.panelHelp.open();

        // create tooltip
        this._Tooltip = new Tooltip(this, currentPlayer);

        // initial resize event
        this.resize();
    }

    // update every server tick
    public update() {
        if (this._Tooltip) {
            this._Tooltip.update();
        }

        //
        this.dragging();
    }

    // runs in the afterRender callback.
    // update every 1000ms
    public slow_update() {
        if (this._targetEntitySelectedBar) {
            this._targetEntitySelectedBar.update();
        }

        if (this._playerEntitySelectedBar) {
            this._playerEntitySelectedBar.update();
        }

        if (this._DebugBox) {
            this._DebugBox.update();
        }

        if (this.panelInventory) {
            this.panelInventory.update();
        }

        if (this.panelAbilities) {
            this.panelAbilities.update();
        }

        if (this.panelCharacter) {
            this.panelCharacter.update();
        }

        if (this.panelHelp) {
            this.panelHelp.update();
        }

        if (this.panelDialog) {
            this.panelDialog.update();
        }

        if (this.panelQuests) {
            this.panelQuests.update();
        }
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
}
