import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Tooltip } from "../Tooltip";
import { applyTheme, getBg } from "../Theme";
import { Scene } from "@babylonjs/core/scene";
import { GameController } from "../../GameController";
import { UserInterface } from "../../UserInterface";

export class Panel {
    public _UI: UserInterface;
    public _game: GameController;
    public _playerUI;
    public _gameRoom;
    private _UITooltip: Tooltip;
    public _scene: Scene;
    public _currentPlayer;
    public _loadedAssets;
    public _options;

    // panel stuff
    public _panel;
    public _panelTitle;
    public _panelContent;

    // drag stuff
    public _isPointerDown: boolean = false;
    public _pointerDownPosition;
    public _isDragging: boolean = false;

    constructor(_UI, _currentPlayer, options) {
        //
        this._UI = _UI;
        this._game = _UI._game;
        this._playerUI = _UI._playerUI;
        this._UITooltip = _UI._UITooltip;
        this._gameRoom = _UI._gameRoom;
        this._scene = _UI._scene;
        this._currentPlayer = _currentPlayer;
        this._loadedAssets = _UI._loadedAssets;

        // set defaults
        this._options = {
            name: options.name ?? "Panel Name",
            horizontal_position: options.horizontal_position ?? Control.HORIZONTAL_ALIGNMENT_CENTER,
            vertical_position: options.vertical_position ?? Control.VERTICAL_ALIGNMENT_CENTER,
            width: options.width ?? 1,
            height: options.height ?? 1,
            top: options.top ?? "0px",
            left: options.left ?? "0px",
            stayOpen: options.stayOpen ?? false,
        };

        //
        this._create(this._options);

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {
            // refresh
            this.update();
        });
    }

    // create panel
    private _create(options) {
        let panel: Rectangle = new Rectangle("panel-" + options.name);
        panel.top = options.top;
        panel.left = options.left;
        panel.width = options.width;
        panel.height = options.height;
        panel.verticalAlignment = options.horizontal_position;
        panel.horizontalAlignment = options.vertical_position;
        panel.thickness = options.thickness;
        panel.cornerRadius = options.cornerRadius;
        panel.background = options.background;
        panel.color = options.color;
        panel.isPointerBlocker = true;
        panel.isVisible = false;
        panel = applyTheme(panel);
        this._playerUI.addControl(panel);

        this._panel = panel;

        this._createHeader();
        this._createContentPanel();
    }

    // create panel header
    private _createContentPanel() {
        const panelContent: Rectangle = new Rectangle("panelContent");
        panelContent.top = "30px;";
        panelContent.left = 0;
        panelContent.width = 1;
        panelContent.height = 0.9;
        panelContent.thickness = 0;
        panelContent.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        panelContent.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._panel.addControl(panelContent);
        this._panelContent = panelContent;
    }

    // create panel header
    private _createHeader() {
        const panelHeader: Rectangle = new Rectangle("panelHeader");
        panelHeader.top = 0;
        panelHeader.left = 0;
        panelHeader.width = 1;
        panelHeader.height = "30px";
        panelHeader.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        panelHeader.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panelHeader.color = "rgba(0,0,0,1)";
        panelHeader.thickness = 0;
        this._panel.addControl(panelHeader);

        // header title
        var panelTitle = new TextBlock("panelTitle");
        panelTitle.text = this._options.name;
        panelTitle.fontSize = "12px";
        panelTitle.color = "#FFFFFF";
        panelTitle.top = "5px";
        panelTitle.left = "5px";
        panelTitle.fontSize = "18px";
        panelTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panelTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        panelTitle.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panelTitle.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        panelHeader.addControl(panelTitle);
        this._panelTitle = panelTitle;

        // close button
        const mainPanelClose = Button.CreateSimpleButton("mainPanelClose", "X");
        mainPanelClose.width = "20px";
        mainPanelClose.height = "20px";
        mainPanelClose.color = "white";
        mainPanelClose.top = "5px";
        mainPanelClose.left = "-5px";
        mainPanelClose.thickness = 1;
        mainPanelClose.background = "black";
        mainPanelClose.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        mainPanelClose.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        panelHeader.addControl(mainPanelClose);
        mainPanelClose.onPointerDownObservable.add(() => {
            this.close();
        });

        // drag and drop events
        panelHeader.onPointerDownObservable.add((e) => {
            this._UI.startDragging(this._panel);
            this._panel.isPointerBlocker = false;
        });
        panelHeader.onPointerUpObservable.add((e) => {
            this._UI.stopDragging();
        });
    }

    // open panel
    public open(): void {
        if (!this._options.stayOpen) {
            this._UI.panelAbilities._panel.isVisible = false;
            this._UI.panelCharacter._panel.isVisible = false;
            this._UI.panelHelp._panel.isVisible = false;
        }

        // if already open, close panel
        if (this._panel.isVisible) {
            this._panel.isVisible = false;
        } else {
            this._panel.isVisible = true;
        }
    }

    // close panel
    public close() {
        this._panel.isVisible = false;
    }

    // update panel
    public update() {}

    // refresh panel
    public refresh() {}
}
