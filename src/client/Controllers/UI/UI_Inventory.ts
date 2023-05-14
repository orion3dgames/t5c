import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Control } from "@babylonjs/gui/2D/controls/control";
import Config from "../../../shared/Config";
import { Grid } from "@babylonjs/gui/2D/controls/grid";
import { dataDB } from "../../../shared/Data/dataDB";
import { Item } from "../../../shared/Data/ItemDB";
import { UI_Tooltip } from "./UI_Tooltip";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";
import { generatePanel } from "./UI_Theme";

export class UI_Inventory {
    private _UI;
    private _playerUI;
    private _gameRoom;
    private _UITooltip: UI_Tooltip;
    private _scene;
    private _currentPlayer;
    private _loadedAssets;
    private _options;

    // inventory tab
    private panel: Rectangle;
    private _inventoryGrid: Rectangle[] = [];
    private _goldUI: TextBlock;

    constructor(
        _UI,
        _currentPlayer
    ) {
        //
        this._UI = _UI;
        this._playerUI = _UI._playerUI;
        this._UITooltip = _UI._UITooltip;
        this._loadedAssets = _UI._loadedAssets;
        this._gameRoom = _UI._gameRoom;
        this._scene = _UI._scene;
        this._currentPlayer = _currentPlayer;

        //
        this._createUI();

        // dynamic events
        let entity = this._currentPlayer.entity;
        if (entity) {
            entity.inventory.onAdd((item, sessionId) => {
                this.refreshItems();
            });
            entity.inventory.onRemove((item, sessionId) => {
                this.refreshItems();
            });
            entity.inventory.onChange((item, sessionId) => {
                this.refreshItems();
            });
        }

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {
            // refresh
            this._update();
        });
    }

    // open panel
    public open() {
        this.refreshItems();
        this.panel.isVisible = true;
    }

    // close panel
    public close() {
        this.panel.isVisible = false;
    }

    // refresh panel
    private _update() {
        if(this._currentPlayer){
            this._goldUI.text = "Gold: "+this._currentPlayer.player_data.gold;
        }  
    }

    // create panel
    private _createUI() {

        const panel = generatePanel(
            "chatPanel",
            Control.HORIZONTAL_ALIGNMENT_LEFT,
            Control.VERTICAL_ALIGNMENT_BOTTOM,
            "246px;",
            "300px",
            "-30px",
            "-15px"
        );
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        panel.isPointerBlocker = true;
        this._playerUI.addControl(panel);
        this.panel = panel;

        // panel title 
        var panelTitle = new TextBlock("panelTitle");
        panelTitle.text = "Inventory";
        panelTitle.fontSize = "12px";
        panelTitle.color = "#FFFFFF";
        panelTitle.top = "5px";
        panelTitle.left = "5px";
        panelTitle.fontSize = "18px";
        panelTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panelTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        panelTitle.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panelTitle.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        panel.addControl(panelTitle);

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
        panel.addControl(mainPanelClose);

        // on click send
        mainPanelClose.onPointerDownObservable.add(() => {
            this.close();
        });

        //////////////////////////////////////////

        // panel title 
        var goldTitle = new TextBlock("goldTitle");
        goldTitle.text = "Gold: 0";
        goldTitle.fontSize = "12px";
        goldTitle.color = "rgba(255,255,255,.9)";
        goldTitle.top = "-5px";
        goldTitle.left = "5px";
        goldTitle.fontSize = "14px";
        goldTitle.width = 1;
        goldTitle.height = "30px;";
        goldTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        goldTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        goldTitle.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        goldTitle.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        panel.addControl(goldTitle);
        this._goldUI = goldTitle;

        ///////////////////////////////////////////////////////

        let inventoryGrid = new Rectangle("inventoryGrid");
        inventoryGrid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        inventoryGrid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        inventoryGrid.left = "5px";
        inventoryGrid.top = "32px";
        inventoryGrid.width = 1;
        inventoryGrid.height = 1;
        inventoryGrid.thickness = 0;
        panel.addControl(inventoryGrid);

        let inventorySpace = 25;
        let inventorySpaceW = 5;
        let size = 47;
        let inventorySpaceCols = inventorySpaceW;
        let inventorySpaceRows = inventorySpace / inventorySpaceW;

        let grid = new Grid();
        grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        grid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        grid.left = "0px;";
        grid.width = 1;
        grid.heightInPixels = inventorySpaceRows * (size + 10);
        inventoryGrid.addControl(grid);

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
                inventorySpace.background = "rgba(255,255,255,.1)";
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

    ///////////////////////////////////////
    ///////////////////////////////////////
    // INVENTORY PANEL
    public refreshItems() {

        console.log('refreshItems');

        let i = 0;
        this._currentPlayer.inventory.forEach((element) => {
            let child = this._inventoryGrid[i];
            let item = dataDB.get("item", element.key) as Item;

            // dispose
            console.log(child);
            if(child.children){
                child.children.forEach((el)=>{
                    el.dispose();
                })
            }
        
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
}
