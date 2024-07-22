import { Control, TextBlock } from "@babylonjs/gui/2D/controls";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { getBg, createButton, applyTheme } from "./Theme";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { UserInterface } from "../UserInterface";
import State from "../../Screens/Screens";
import { GameController } from "../GameController";
import { ServerMsg } from "../../../shared/types";
import { Tools } from "@babylonjs/core/Misc/tools";

export class MainMenu {
    private _UI: UserInterface;
    private _playerUI;
    private _engine: Engine;
    private _scene: Scene;
    private _game: GameController;
    private _room;
    private _currentPlayer;

    private _mainPanel: Rectangle;

    constructor(_UI: UserInterface, _currentPlayer) {
        this._UI = _UI;
        this._playerUI = _UI._playerUI;
        this._scene = _UI._scene;
        this._currentPlayer = _currentPlayer;
        this._room = _UI._room;
        this._game = _UI._game;
        this._engine = _UI._engine;

        // mainmenu panel
        let mainmenuPanel = new Rectangle("mainmenuPanel");
        mainmenuPanel.top = "15px;";
        mainmenuPanel.left = "-15px;";
        mainmenuPanel.width = "400px;";
        mainmenuPanel.height = "60px";
        mainmenuPanel.thickness = 0;
        mainmenuPanel.isVisible = true;
        mainmenuPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        mainmenuPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._playerUI.addControl(mainmenuPanel);
        this._mainPanel = mainmenuPanel;

        this._createUI();
        this._createDropdownMenu();
    }

    takeScreenshot() {
        this._UI._Watermark._bloc.isVisible = true;
        Tools.CreateScreenshot(
            this._engine,
            this._currentPlayer.cameraController.camera,
            { width: 2560, height: 1440, precision: 0.9 },
            () => {
                this._UI._Watermark._bloc.isVisible = false;
                console.log("Screnshot taken!");
            },
            "image/jpeg",
            true,
            0.9
        );
    }

    _createDropdownMenu() {
        let dropdownOptions = {
            menuTitle: "O",
            children: {
                reset: {
                    menuTitle: "Stuck?",
                    click: () => {
                        this._game.sendMessage(ServerMsg.PLAYER_RESET_POSITION);
                    },
                },
                screenshot: {
                    menuTitle: "Take a picture",
                    click: () => {
                        this.takeScreenshot();
                    },
                },
                /*
                debug: {
                    menuTitle: "Debug Scene",
                    click: () => {
                         // leave colyseus rooms
                        this._room.leave();
                        this._game.currentChat.leave();
                        this._game.setScene(State.DEBUG_SCENE);
                    },
                },*/
                quit: {
                    menuTitle: "Quit",
                    click: () => {
                        this._currentPlayer.quit();
                    },
                },
            },
        };

        let button = createButton("button_dropdown", dropdownOptions.menuTitle, "30px", "30px");
        button.top = "0px;";
        button.left = "0px;";
        button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        button.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._mainPanel.addControl(button);

        var b1 = new Image("b1", "./images/ui/gear-solid.png");
        b1.stretch = Image.STRETCH_UNIFORM;
        button.addControl(b1);

        let drowpdownMenu = new Rectangle("drowpdownMenu");
        drowpdownMenu.top = "60px;";
        drowpdownMenu.left = "-15px;";
        drowpdownMenu.width = "150px;";
        drowpdownMenu.height = "100px";
        drowpdownMenu.isVisible = true;
        drowpdownMenu.adaptHeightToChildren = true;
        drowpdownMenu.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        drowpdownMenu.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        applyTheme(drowpdownMenu);
        this._playerUI.addControl(drowpdownMenu);

        const grid = new StackPanel("drowpdownStack");
        grid.top = "0px";
        grid.left = "0px";
        grid.width = 1;
        grid.spacing = 5;
        grid.setPadding(5, 0, 5, 0);
        grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        drowpdownMenu.addControl(grid);

        button.onPointerDownObservable.add(() => {
            drowpdownMenu.isVisible = !drowpdownMenu.isVisible;
        });

        let i = 0;
        for (let index in dropdownOptions.children) {
            let menuItem = dropdownOptions.children[index];
            let button = createButton("button_" + i, menuItem.menuTitle, 1, "30px");
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

    _createUI() {
        let menuItems = {
            inventory: {
                menuTitle: "Inventory",
                icon: "ICON_MENU_inventory",
                click: () => {
                    this.openPanel("inventory");
                },
            },
            quests: {
                menuTitle: "Quests",
                icon: "ICON_MENU_quest",
                click: () => {
                    this.openPanel("quests");
                },
            },
            abilities: {
                menuTitle: "Abilities",
                icon: "ICON_MENU_abilities",
                click: () => {
                    this.openPanel("abilities");
                },
            },
            character: {
                menuTitle: "Character",
                icon: "ICON_MENU_character",
                click: () => {
                    this.openPanel("character");
                },
            },
            help: {
                menuTitle: "Help",
                icon: "ICON_MENU_help",
                click: () => {
                    this.openPanel("help");
                },
            },
        };

        const grid = new StackPanel("mainmenu");
        grid.top = "0px";
        grid.left = "-40px";
        grid.height = "30px;";
        grid.spacing = 5;
        grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        grid.isVertical = false;
        this._mainPanel.addControl(grid);

        // add menu tooltip
        const buttonTooltip = createButton("button_tooltip", "", "100px", "30px", "");
        grid.addControl(buttonTooltip);
        let buttonTooltipText = buttonTooltip.getChildByName("button_tooltip_text") as TextBlock;
        buttonTooltip.isVisible = false;

        //
        let i = 0;
        for (let index in menuItems) {
            let menuItem = menuItems[index];
            const button = createButton("button_" + i, "", "35px", "30px", menuItem.icon);
            grid.addControl(button);

            if (menuItem.click) {
                button.onPointerDownObservable.add(() => {
                    menuItem.click();
                });
            }

            button.onPointerEnterObservable.add(() => {
                buttonTooltipText.text = menuItem.menuTitle;
                buttonTooltip.isVisible = true;
            });

            button.onPointerOutObservable.add(() => {
                buttonTooltipText.text = "";
                buttonTooltip.isVisible = false;
            });

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
            case "help":
                this._UI.panelHelp.open();
                break;
            case "quests":
                this._UI.panelQuests.open();
                break;
        }
    }
}
