import { Control } from "@babylonjs/gui/2D/controls/control";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { getBg, createButton } from "./Theme";
import { Button } from "@babylonjs/gui/2D/controls/button";
import State from "../../Screens/Screens";
import { SceneController } from "../../Controllers/Scene";
import { StackPanel } from "@babylonjs/gui";

export class MainMenu {
    private _UI;
    private _playerUI;
    private _engine: Engine;
    private _scene: Scene;
    private _gameRoom;
    private _currentPlayer;

    constructor(_UI, _currentPlayer) {
        this._UI = _UI;
        this._playerUI = _UI._playerUI;
        this._scene = _UI._scene;
        this._currentPlayer = _currentPlayer;
        this._gameRoom = _UI._gameRoom;

        this._createUI();
    }

    _createUI() {
        let menuItems = {
            inventory: {
                menuTitle: "Inventory",
                click: () => {
                    this.openPanel("inventory");
                },
            },
            abilities: {
                menuTitle: "Abilities",
                click: () => {
                    this.openPanel("abilities");
                },
            },
            character: {
                menuTitle: "Character",
                click: () => {
                    this.openPanel("character");
                },
            },
            reset: {
                menuTitle: "Unstuck",
                click: () => {
                    this._gameRoom.send("reset_position");
                },
            },
            quit: {
                menuTitle: "Quit",
                click: () => {
                    this._gameRoom.leave();
                    SceneController.goToScene(State.CHARACTER_SELECTION);
                },
            },
        };

        const grid = new StackPanel("mainmenu");
        grid.top = "15px";
        grid.left = "-2px";
        grid.width = "460px";
        grid.height = "36px;";
        grid.spacing = 5;
        grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        grid.isVertical = false;
        this._playerUI.addControl(grid);

        let i = 0;
        for (let index in menuItems) {
            let menuItem = menuItems[index];
            let button = createButton("button_" + i, menuItem.menuTitle, 85, 30);
            button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            button.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            grid.addControl(button);
            if (menuItem.click) {
                button.onPointerDownObservable.add(() => {
                    menuItem.click();
                });
            }
            i++;
        }
    }

    public openPanel(key) {
        switch (key) {
            case "inventory":
                this._UI.panelInventory.open();
                break;
            case "character":
                this._UI.panelCharacter.open();
                break;
            case "abilities":
                this._UI.panelAbilities.open();
                break;
        }
    }
}
