import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Grid } from "@babylonjs/gui/2D/controls/grid";
import { dataDB } from "../../../../shared/Data/dataDB";
import { Item } from "../../../../shared/Data/ItemDB";
import { Panel } from "./Panel";

export class Panel_Inventory extends Panel {
    // inventory tab
    private panel: Rectangle;
    private _inventoryGrid: Rectangle[] = [];
    private _goldUI: TextBlock;

    public sceneRendered = false;

    constructor(_UI, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);

        //this.createContent();

        // dynamic events
        let entity = this._currentPlayer.entity;
        if (entity) {
            entity.player_data.inventory.onAdd((item, sessionId) => {
                this.refresh();
                // todo: could be a performance issue here?
                // orion to keep an eye on this one
                item.onChange((item, sessionId) => {
                    this.refresh();
                });
                item.onRemove((item, sessionId) => {
                    this.refresh();
                });
            });
        }

        // some ui must be constantly refreshed as things change
        this._scene.registerAfterRender(() => {
            // refresh
            if (!this.sceneRendered) {
                this.createContent();
            }
            this.sceneRendered = true;

            this.update();
        });
    }

    // open panel
    public open() {
        super.open();
        this.refresh();
    }

    // refresh panel
    public update() {
        super.update();
        if (this._currentPlayer && this._goldUI) {
            this._goldUI.text = "Gold: " + this._currentPlayer.player_data.gold;
        }
    }

    // create panel
    private createContent() {
        let panel: Rectangle = this._panelContent;

        // if already exists
        panel.children.forEach((el) => {
            console.log(el.name);
            el.dispose();
        });

        // panel title
        var goldTitle = new TextBlock("goldTitle");
        goldTitle.text = "Gold: 0";
        goldTitle.fontSize = "12px";
        goldTitle.color = "rgba(255,255,255,.9)";
        goldTitle.top = "-33px";
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
        inventoryGrid.left = "0px";
        inventoryGrid.top = "0px";
        inventoryGrid.width = 1;
        inventoryGrid.height = 1;
        inventoryGrid.thickness = 0;
        panel.addControl(inventoryGrid);

        let panelWidth = panel.widthInPixels;
        let inventorySpace = 25;
        let inventorySpaceW = 5;
        let size = panelWidth / 5;
        let inventorySpaceCols = inventorySpaceW;
        let inventorySpaceRows = inventorySpace / inventorySpaceW;

        // create grid
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
        this.refresh();
    }

    ///////////////////////////////////////
    ///////////////////////////////////////
    // INVENTORY PANEL
    public refresh() {
        // if inventory is empty, make sure to clear all unessacary UI elements
        this._inventoryGrid.forEach((child) => {
            child.getDescendants().forEach((el) => {
                el.dispose();
            });
            child.metadata = {};
            this._UI._Tooltip.close();
        });

        ///////////////////////
        // else show items
        let i = 0;
        this._currentPlayer.player_data.inventory.forEach((element) => {
            let child = this._inventoryGrid[i];
            let item = dataDB.get("item", element.key) as Item;

            // dispose
            child.getDescendants().forEach((el) => {
                el.dispose();
            });

            // set metadata
            child.metadata = {
                item: item,
            };

            // add item icon
            var imageData = this._loadedAssets[item.icon];
            var img = new Image("itemImage_" + element.key, imageData);
            img.stretch = Image.STRETCH_FILL;
            child.addControl(img);

            // add item qty
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

            // on item hover
            child.onPointerEnterObservable.clear();
            child.onPointerEnterObservable.add(() => {
                if (child.metadata.item) {
                    this._UI._Tooltip.refresh("item", item, child);
                }
            });
            // on item unhover
            child.onPointerOutObservable.clear();
            child.onPointerOutObservable.add(() => {
                if (child.metadata.item) {
                    this._UI._Tooltip.close();
                }
            });
            // on hover tooltip
            child.onPointerClickObservable.clear();
            child.onPointerClickObservable.add((e) => {
                if (child.metadata.item && e.buttonIndex === 2) {
                    this._gameRoom.send("equip_item", child.metadata.item.key);
                }
            });

            i++;
        });
    }
}
