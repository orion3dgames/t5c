import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Grid } from "@babylonjs/gui/2D/controls/grid";
import { Item, ServerMsg } from "../../../../shared/types";
import { Rarity } from "../../../../shared/Class/Rarity";
import { Panel } from "./Panel";

export class Panel_Inventory extends Panel {
    // inventory tab
    private panel: Rectangle;
    private _inventoryGrid: Rectangle[] = [];
    private _goldUI: TextBlock;
    private bgColor: string = "rgba(255,255,255,.1)";

    public sceneRendered = false;

    constructor(_UI, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);

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
            entity.player_data.listen("gold", (currentValue, previousValue) => {
                this.updateGold();
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

    public close() {
        super.close();
        this._UI._InventoryDropdown.hideDropdown();
    }

    // refresh panel
    public update() {
        super.update();
    }

    // create panel
    private createContent() {
        let panel: Rectangle = this._panelContent;

        // if already exists
        panel.children.forEach((el) => {
            el.dispose();
        });

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
        inventoryGrid.left = "0px";
        inventoryGrid.top = "0px";
        inventoryGrid.width = 1;
        inventoryGrid.height = 1;
        inventoryGrid.thickness = 0;
        panel.addControl(inventoryGrid);

        let panelWidth = panel.widthInPixels;
        let inventorySpace = this._game.config.PLAYER_INVENTORY_SPACE;
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
                if (i < this._game.config.PLAYER_INVENTORY_SPACE) {
                    const inventorySpace = new Rectangle("inventorySpace_" + i);
                    inventorySpace.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                    inventorySpace.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                    inventorySpace.top = 0.1;
                    inventorySpace.left = 0.1;
                    inventorySpace.width = 0.9;
                    inventorySpace.height = 0.9;
                    inventorySpace.background = this.bgColor;
                    inventorySpace.thickness = 2;
                    inventorySpace.color = this.bgColor;
                    inventorySpace.cornerRadius = 0;
                    grid.addControl(inventorySpace, r, col);

                    this._inventoryGrid.push(inventorySpace);

                    i++;
                }
            }
        }

        //
        this.refresh();
    }

    updateGold() {
        if (this._goldUI) {
            this._goldUI.text = "Gold: " + this._currentPlayer.player_data.gold;
        }
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
            child.background = this.bgColor;
            child.color = this.bgColor;
            this._UI._Tooltip.close();
        });

        // if inventory is empty, do not do anything
        if (this._inventoryGrid.length < 1) {
            return false;
        }

        // show items
        this._currentPlayer.player_data.inventory.forEach((element) => {
            let index = element.i;
            let child = this._inventoryGrid[index];
            let item = this._game.getGameData("item", element.key) as Item;

            //
            let color = Rarity.getColor(item);
            child.background = color.bg;
            child.thickness = 2;
            child.color = color.color;

            // dispose
            child.getDescendants().forEach((el) => {
                el.dispose();
            });

            // set metadata
            child.metadata = {
                item: item,
                index: index,
                background: child.background,
            };

            // add item icon
            var imageData = this._loadedAssets[item.icon];
            var img = new Image("itemImage_" + element.key, imageData);
            img.stretch = Image.STRETCH_FILL;
            child.addControl(img);

            // add item qty
            const itemTxtQty = new TextBlock("itemTxtQty" + index);
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
                if (child.metadata.item && e.buttonIndex === 0) {
                    if (this._game.sellingMode) {
                        this._game.sendMessage(ServerMsg.PLAYER_SELL_ITEM, {
                            index: element.i,
                        });
                    }
                }
                if (child.metadata.item && e.buttonIndex === 2) {
                    this._UI._Tooltip.close();
                    this._UI._InventoryDropdown.showDropdown(child, item, element);
                }
            });
        });

        // update golve value just in case
        this.updateGold();
    }
}
