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
    Panel_Inventory,
    CastingBar,
    ExperienceBar,
    MainMenu,
    RessurectBox,
    Panel_Abilities,
    Panel_Character,
} from "./UI";

import { Room } from "colyseus.js";
import State from "../Screens/Screens";
import { SceneController } from "../Controllers/Scene";
import Config from "../../shared/Config";
import { Leveling } from "../../shared/Entities/Player/Leveling";

import { Entity } from "../../shared/Entities/Entity";
import { Player } from "../../shared/Entities/Player";
import { Item } from "../../shared/Entities/Item";

import { generatePanel, getBg } from "./UI/Theme";
import { Grid } from "@babylonjs/gui";

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
    public _ChatBox: ChatBox;
    private _DebugBox: DebugBox;
    private _AbilityBar: AbilityBar;
    private _targetEntitySelectedBar: EntitySelectedBar;
    private _playerEntitySelectedBar: EntitySelectedBar;
    private _Tooltip: Tooltip;
    private _MainMenu: MainMenu;
    public _CastingBar: CastingBar;
    public _RessurectBox: RessurectBox;
    private _ExperienceBar: ExperienceBar;

    // openable panels
    private panelInventory: Panel_Inventory;
    private panelAbilities: Panel_Abilities;
    private panelCharacter: Panel_Character;

    // tooltip
    public _UITooltip;

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
    }

    // set current player
    ////////////////////////////
    public setCurrentPlayer(currentPlayer) {
        // set current player
        this._currentPlayer = currentPlayer;

        // create main interface elements
        this._MainMenu = new MainMenu(this, currentPlayer);
        this._CastingBar = new CastingBar(this, currentPlayer);
        this._RessurectBox = new RessurectBox(this, currentPlayer);
        this._ExperienceBar = new ExperienceBar(this, currentPlayer);

        // create abilities ui + events
        this._AbilityBar = new AbilityBar(this, currentPlayer);

        // create chat ui + events
        this._ChatBox = new ChatBox(this._playerUI, this._chatRoom, currentPlayer, this._entities);

        // create debug ui + events
        this._DebugBox = new DebugBox(this._playerUI, this._engine, this._scene, this._gameRoom, this._currentPlayer, this._entities);

        // create selected entity panel
        this._targetEntitySelectedBar = new EntitySelectedBar(this._playerUI, this._scene, {
            panelName: "target",
            currentPlayer: false,
        });
        this._playerEntitySelectedBar = new EntitySelectedBar(this._playerUI, this._scene, {
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

        // create panel
        this.panelAbilities = new Panel_Abilities(this, currentPlayer, {
            name: "Abilities",
            width: "500px;",
            height: "300px;",
            top: "0px;",
            left: "5px;",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_CENTER,
            vertical_position: Control.VERTICAL_ALIGNMENT_CENTER,
        });

        // create panel
        this.panelCharacter = new Panel_Character(this, currentPlayer, {
            name: "Character",
            width: "500px;",
            height: "300px;",
            top: "30px;",
            left: "30px;",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_CENTER,
            vertical_position: Control.VERTICAL_ALIGNMENT_CENTER,
        });

        // create tooltip
        this._Tooltip = new Tooltip(this, currentPlayer);

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {
            this.refreshEntityUI();
        });
    }

    public refreshEntityUI() {
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
