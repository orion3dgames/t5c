import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import Config from "../../../shared/Config";

export class UI_Panel {
    private _playerUI;
    private _scene;
    private _currentPlayer;
    private _options;
    private _tabs;
    private tabContent = [];
    private tabButtons = [];
    private selectedTab;
    private selectedTabUI;

    constructor(
        _playerUI,
        _scene,
        _currentPlayer,
        options = {
            name: "Default Name",
            horizontal_position: Control.HORIZONTAL_ALIGNMENT_CENTER,
            vertical_position: Control.VERTICAL_ALIGNMENT_CENTER,
            width: 0.7, // 50% screen width
            height: 0.5, // 50% screen height
        }
    ) {
        //
        this._playerUI = _playerUI;
        this._scene = _scene;
        this._currentPlayer = _currentPlayer;
        this._options = options;

        //
        this.selectedTab = "";
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
        mainPanel.top = "-50px;";
        mainPanel.left = 0;
        mainPanel.width = this._options.width;
        mainPanel.height = this._options.height;
        mainPanel.background = Config.UI_CENTER_PANEL_BG;
        mainPanel.verticalAlignment = this._options.horizontal_position;
        mainPanel.horizontalAlignment = this._options.vertical_position;
        mainPanel.isVisible = false;
        this._playerUI.addControl(mainPanel);
        this.selectedTabUI = mainPanel;

        // close button
        const mainPanelClose = Button.CreateSimpleButton("mainPanelClose", "X");
        mainPanelClose.width = "30px";
        mainPanelClose.height = "30px";
        mainPanelClose.color = "white";
        mainPanelClose.top = "0px";
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
            tabButton.thickness = 1;
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
            tabContent.thickness = 1;
            tabContent.background = "rgba(255,255,255, 0.1)";
            tabContent.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            tabContent.horizontalAlignment = this._options.vertical_position;
            tabContent.isVisible = this.selectedTab === tabId ? true : false;
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
            this[tabId](tabContent, tab);
        }

        // add selected tab
    }

    // open panel
    public setSelectedTab(key) {
        for (let tabId in this._tabs) {
            this.tabContent[tabId].isVisible = false;
            this.tabButtons[tabId].background = "#000";
        }

        this.selectedTabUI.isVisible = true;
        this.tabContent[key].isVisible = true;
        this.tabButtons[key].background = "green";
        this.selectedTab = key;
    }

    // open panel
    public open(key) {
        if (this.selectedTab === key) {
            this.selectedTabUI.isVisible = false;
            this.selectedTab = "";
            return false;
        }
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
        const entityNameTxt = new TextBlock("entityNameTxt");
        entityNameTxt.text = tab.title;
        entityNameTxt.color = "#FFF";
        entityNameTxt.top = "5px";
        entityNameTxt.left = "0";
        entityNameTxt.fontSize = "16px;";
        entityNameTxt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        entityNameTxt.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        entityNameTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        panel.addControl(entityNameTxt);
    }

    ///////////////////////////////////////
    ///////////////////////////////////////
    // INVENTORY PANEL
    public inventory() {}

    ///////////////////////////////////////
    ///////////////////////////////////////
    // SKILLS PANEL
    public skills() {}
}
