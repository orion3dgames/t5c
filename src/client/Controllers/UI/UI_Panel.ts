import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import Config from "../../../shared/Config";
import { Grid } from "@babylonjs/gui/2D/controls/grid";
import { Container } from "@babylonjs/gui/2D/controls/container";
import { dataDB } from "../../../shared/Data/dataDB";
import { Item } from "../../../shared/Data/ItemDB";
import { UI_Tooltip } from "./UI_Tooltip";

export class UI_Panel {
    private _UI;
    private _playerUI;
    private _UITooltip: UI_Tooltip;
    private _scene;
    private _currentPlayer;
    private _loadedAssets;
    private _options;
    private _tabs;
    private tabContent: Rectangle[] = [];
    private tabButtons = [];
    private selectedTab;
    private selectedTabUI;

    // inventory tab
    private _inventoryGrid: Rectangle[] = [];

    constructor(
        _UI,
        _currentPlayer,
        options = {
            name: "Default Name",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_CENTER,
            vertical_position: Control.VERTICAL_ALIGNMENT_CENTER,
            //width: 1, // 50% screen width
            //height: 1, // 50% screen height
            width: "500px;", // 50% screen width
            height: "400px", // 50% screen height
        }
    ) {
        //
        this._UI = _UI;
        this._playerUI = _UI._playerUI;
        this._UITooltip = _UI._UITooltip;
        this._loadedAssets = _UI._loadedAssets;
        this._scene = _UI._scene;
        this._currentPlayer = _currentPlayer;
        this._options = options;

        //
        this.selectedTab = "character";
        this._tabs = {
            character: {
                title: "Character",
            },
            inventory: {
                title: "Inventory",
            },
            skills: {
                title: "Skills",
            },
        };

        //
        this._createUI();

        //
        if (this._currentPlayer && this.selectedTab === "inventory") {
            let entity = this._currentPlayer.entity;
            entity.inventory.onAdd((item, sessionId) => {
                //console.log("onAdd", item, sessionId);
                this.refreshItems();
            });
            entity.inventory.onRemove((item, sessionId) => {
                //console.log("onRemove", item, sessionId);
                this.refreshItems();
            });
            entity.inventory.onChange((item, sessionId) => {
                //console.log("onChange", item, sessionId);
                this.refreshItems();
            });
        }

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {
            // refresh
            this._update();
        });
    }

    // create panel
    private _createUI() {
        // debug only
        Config.UI_CENTER_PANEL_BG = "rgba(0,0,0,1)";

        // main panel
        const mainPanel = new Rectangle("mainPanel");
        mainPanel.top = 0;
        mainPanel.left = 0;
        mainPanel.width = this._options.width;
        mainPanel.height = this._options.height;
        mainPanel.verticalAlignment = this._options.horizontal_position;
        mainPanel.horizontalAlignment = this._options.vertical_position;
        mainPanel.isVisible = false;
        mainPanel.thickness = 0;
        mainPanel.isPointerBlocker = true;
        this._playerUI.addControl(mainPanel);
        this.selectedTabUI = mainPanel;

        var image = new Image("but", "/ui/panel_blue2x.9.png");
        image.width = 1;
        image.height = 1;
        image.populateNinePatchSlicesFromImage = true;
        image.stretch = Image.STRETCH_NINE_PATCH;
        mainPanel.addControl(image);

        // close button
        const mainPanelClose = Button.CreateSimpleButton("mainPanelClose", "X");
        mainPanelClose.width = "30px";
        mainPanelClose.height = "30px";
        mainPanelClose.color = "white";
        mainPanelClose.top = "15px";
        mainPanelClose.left = "-15px";
        mainPanelClose.thickness = 1;
        mainPanelClose.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        mainPanelClose.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        mainPanel.addControl(mainPanelClose);

        // on click send
        mainPanelClose.onPointerDownObservable.add(() => {
            this.close();
        });

        // tabs button container
        const tabsPanel = new StackPanel("tabsPanel");
        tabsPanel.width = 0.9;
        tabsPanel.spacing = 2;
        tabsPanel.paddingTop = "15px";
        tabsPanel.paddingLeft = "15px";
        tabsPanel.isVertical = false;
        tabsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tabsPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        mainPanel.addControl(tabsPanel);

        // tab button
        let i = 0;
        for (let tabId in this._tabs) {
            let tab = this._tabs[tabId];
            i++;
            // calculate responsive width and height
            let iconWidth = mainPanel.widthInPixels / this._tabs;
            let leftMargin = i > 1 ? (i - 1) * iconWidth + "px" : "0px";

            const tabButton = Button.CreateSimpleButton("tabButton" + tabId, tab.title);
            tabButton.width = "100px";
            tabButton.height = "30px";
            tabButton.color = "white";
            tabButton.top = "0px";
            tabButton.thickness = 0;
            tabButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            tabButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            tabsPanel.addControl(tabButton);
            this.tabButtons[tabId] = tabButton;

            // on click send
            tabButton.onPointerDownObservable.add(() => {
                this.setSelectedTab(tabId);
            });

            // tab content
            const tabContent = new Rectangle("tabContent" + tabId);
            tabContent.top = 0;
            tabContent.left = 0;
            tabContent.width = 1;
            tabContent.height = 0.917;
            tabContent.thickness = 0;
            tabContent.paddingBottom = "15px;";
            tabContent.paddingLeft = "15px;";
            tabContent.paddingRight = "15px;";
            tabContent.paddingTop = "15px;";
            tabContent.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            tabContent.horizontalAlignment = this._options.vertical_position;
            tabContent.isVisible = false;
            mainPanel.addControl(tabContent);

            const entityNameTxt = new TextBlock("entityNameTxt");
            entityNameTxt.text = tab.title;
            entityNameTxt.color = "#FFF";
            entityNameTxt.top = "5px";
            entityNameTxt.left = "0";
            entityNameTxt.fontSize = "16px;";
            entityNameTxt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            entityNameTxt.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            entityNameTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            tabContent.addControl(entityNameTxt);

            this.tabContent[tabId] = tabContent;
        }

        // add selected tab
        //this.setSelectedTab(this.selectedTab);
    }

    // open panel
    public setSelectedTab(key) {
        // remove children
        for (var i in this.tabContent[key]._children) {
            let el = this.tabContent[key]._children[i];
            el.dispose();
        }

        // hide all tabs buttons
        for (let tabId in this._tabs) {
            this.tabContent[tabId].isVisible = false;
            this.tabButtons[tabId].background = "#000";
        }

        // show
        this.selectedTabUI.isVisible = true;
        this.tabContent[key].isVisible = true;
        this.tabButtons[key].background = "green";
        this.selectedTab = key;

        // refresh tab content
        this[key](this.tabContent[key], key);
    }

    // open panel
    public open(key) {
        /*
        if (this.selectedTab === key) {
            this.selectedTabUI.isVisible = false;
            this.selectedTab = "";
            return false;
        }*/
        this.setSelectedTab(key);
    }

    // close panel
    public close() {
        this.selectedTab = "";
        this.selectedTabUI.isVisible = false;
    }

    // refresh panel
    private _update() {}

    ///////////////////////////////////////
    ///////////////////////////////////////
    // CHARACTER PANEL
    public character(panel, tab) {
        //console.log(tab, panel, tab);
    }

    ///////////////////////////////////////
    ///////////////////////////////////////
    // SKILLS PANEL
    public skills(panel, tab) {
        //console.log(tab, panel, tab);
    }

    ///////////////////////////////////////
    ///////////////////////////////////////
    // INVENTORY PANEL
    public refreshItems() {
        if (this.selectedTab !== "inventory") return false;
        let i = 0;
        this._currentPlayer.inventory.forEach((element) => {
            let child = this._inventoryGrid[i];
            let item = dataDB.get("item", element.key) as Item;

            // on hover tooltip
            child.onPointerEnterObservable.add(() => {
                //console.log("HOVER IN", item.key, this);
                this._UI._UITooltip.refresh("item", item, child);
            });
            // on hover tooltip
            child.onPointerOutObservable.add(() => {
                //console.log("HOVER OUT", item.key, this);
                this._UI._UITooltip.close();
            });

            // add icon
            var imageData = this._loadedAssets[item.icon];
            var img = new Image("itemImage_" + element.key, imageData);
            img.stretch = Image.STRETCH_FILL;
            child.addControl(img);

            /*
            const itemTxt = new TextBlock("itemTxt" + i);
            itemTxt.text = element.key;
            itemTxt.color = "#FFF";
            itemTxt.top = "5px";
            itemTxt.left = "5px";
            itemTxt.fontSize = "12px;";
            itemTxt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            itemTxt.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            itemTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            child.addControl(itemTxt);*/

            const itemTxtQty = new TextBlock("itemTxtQty" + i);
            itemTxtQty.text = element.qty;
            itemTxtQty.color = "#FFF";
            itemTxtQty.top = "-2px";
            itemTxtQty.left = "-2px";
            itemTxtQty.fontSize = "12px;";
            itemTxtQty.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            itemTxtQty.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            itemTxtQty.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            child.addControl(itemTxtQty);

            i++;
        });
    }

    public inventory(panel, tab) {
        //console.log(tab, this._currentPlayer);

        let leftPanel = new Rectangle("inventoryLeftPanel");
        leftPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        leftPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        leftPanel.top = "5px";
        leftPanel.left = 0;
        leftPanel.width = 0.48;
        leftPanel.height = 0.92;
        leftPanel.background = "#222";
        leftPanel.thickness = 1;
        panel.addControl(leftPanel);

        // add icon
        var imageData = this._loadedAssets["IMG_character_inventory"];
        var img = new Image("itemImage_IMG_character_inventory", imageData);
        img.stretch = Image.STRETCH_FILL;
        leftPanel.addControl(img);

        let rightPanel = new Rectangle("inventoryRightPanel");
        rightPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        rightPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        rightPanel.top = "5px";
        rightPanel.width = 0.5;
        rightPanel.height = 1;
        rightPanel.background = "";
        rightPanel.thickness = 0;
        panel.addControl(rightPanel);

        let grid = new Grid();
        grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        grid.left = "5px;";
        grid.background = "";
        grid.width = 1;
        grid.height = 1;
        rightPanel.addControl(grid);

        let inventorySpace = 35;
        let inventorySpaceW = 5;
        let size = 46;
        let inventorySpaceCols = inventorySpaceW;
        let inventorySpaceRows = inventorySpace / inventorySpaceW;

        for (let i = 0; i <= inventorySpaceW; i++) {
            grid.addColumnDefinition(size, true);
        }

        for (let i = 0; i <= inventorySpaceRows; i++) {
            grid.addRowDefinition(size, true);
        }

        this._inventoryGrid = [];

        let i = 0;
        for (let r = 0; r < inventorySpaceRows; r++) {
            for (let col = 0; col < inventorySpaceCols; col++) {
                const inventorySpace = new Rectangle("inventorySpace_" + i);
                inventorySpace.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                inventorySpace.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                inventorySpace.top = 0.1;
                inventorySpace.left = 0.1;
                inventorySpace.width = 0.9;
                inventorySpace.height = 0.9;
                inventorySpace.background = "gray";
                inventorySpace.thickness = 0;
                inventorySpace.cornerRadius = 0;
                grid.addControl(inventorySpace, r, col);

                this._inventoryGrid.push(inventorySpace);

                i++;
            }
        }

        //
        this.refreshItems();
    }
}
