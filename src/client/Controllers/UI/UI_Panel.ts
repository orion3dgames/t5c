import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import Config from "../../../shared/Config";
import { getHealthColorFromValue, roundTo } from "../../../shared/Utils";

export class UI_Panel {

    private _playerUI;
    private _scene;
    private _currentPlayer;
    private _options;
    private _tabs;
    private selectedTab;
    private selectedTabUI;

    constructor(_playerUI, _scene, _currentPlayer, options = { 
        name: "Default Name",
        horizontal_position: Control.HORIZONTAL_ALIGNMENT_CENTER, 
        vertical_position: Control.VERTICAL_ALIGNMENT_CENTER, 
        width: 1, // 50% screen width
        height: 1, // 50% screen height
    }) {

        //
        this._playerUI = _playerUI;
        this._scene = _scene;
        this._currentPlayer = _currentPlayer;
        this._options = options;

        // 
        this.selectedTab = "character";
        this._tabs = {
            "character": {
                title: "Character",
            },
            "inventory": {
                title: "Inventory",
            },
            "skills": {
                title: "Skills",
            }
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
    private _createUI(){

        // debug only
        Config.UI_CENTER_PANEL_BG = "rgba(0,0,0,1)";

        // main panel
        const mainPanel = new Rectangle("selectedEntityBar");
        mainPanel.top = 0;
        mainPanel.left = 0;
        mainPanel.width = this._options.width;
        mainPanel.height = this._options.height;
        mainPanel.background = Config.UI_CENTER_PANEL_BG;
        mainPanel.verticalAlignment = this._options.horizontal_position;
        mainPanel.horizontalAlignment = this._options.vertical_position;
        mainPanel.isVisible = true;
        this._playerUI.addControl(mainPanel);
        this.selectedTabUI = mainPanel;

        // tabs container
        const tabsPanel = new StackPanel("tabsPanel");
        tabsPanel.width = "100%";
        tabsPanel.isVertical = false;
        tabsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tabsPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        mainPanel.addControl(tabsPanel);

        for(let tabId in this._tabs){
            let tab = this._tabs[tabId];

            const tabButton = Button.CreateSimpleButton("tabButton"+tabId, tab.title);
            tabButton.width = .2;
            tabButton.height = "30px";
            tabButton.color = "white";
            tabButton.top = "0px";
            tabButton.thickness = 1;
            tabButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            tabButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            tabsPanel.addControl(tabButton);

            // on click send
            tabButton.onPointerDownObservable.add(() => { 
                this.setSelectedTab(tabId);
            });

        }

        // add selected tab
        

    }

    // open panel
    public setSelectedTab(key){

    }

    // open panel
    public open(){

    }

    // close panel
    public close(){

    }

    // refresh panel
    private _update(){

    }


}