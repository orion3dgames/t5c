import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { ItemClass, ServerMsg } from "../../../shared/types";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { UserInterface } from "../UserInterface";

export class InventoryDropdown {
    private _UI;
    private _selected;
    private _room;
    private dropdown: StackPanel;
    private _bgColor = "rgba(255,255,255,0.7";
    constructor(_UI: UserInterface) {
        this._UI = _UI;
        this._room = _UI._room;
    }

    public refresh() {
        if (this.dropdown) {
            this.dropdown.top = this._selected._currentMeasure.top + this._selected.heightInPixels;
            this.dropdown.left = this._selected._currentMeasure.left;
        }
    }

    public hideDropdown() {
        if (this.dropdown) {
            this._selected.background = "rgba(255,255,255,.1)";
            this.dropdown.dispose();
        }
    }

    public showDropdown(el: Rectangle, item, inventory) {
        if (this.dropdown) {
            console.log("ALREAYD OPEN, CLOSE");
            this.hideDropdown();
        }

        this._selected = el;
        this._selected.background = this._bgColor;

        const rect = new StackPanel("mainmenu");
        rect.top = el._currentMeasure.top + el.heightInPixels;
        rect.left = el._currentMeasure.left;
        rect.width = "100px";
        rect.height = "100px";
        rect.background = this._bgColor;
        rect.spacing = 0;
        rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        rect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        rect.isVertical = true;
        this._UI._playerUI.addControl(rect);
        this.dropdown = rect;

        let actions: any = [];
        if (item.class === ItemClass.ARMOR || item.class === ItemClass.WEAPON) {
            actions.push({
                title: "Equip Item",
                click: () => {
                    this._room.send(ServerMsg.PLAYER_USE_ITEM, inventory.i);
                },
            });
        }
        if (item.class === ItemClass.CONSUMABLE) {
            actions.push({
                title: "Use Item",
                click: () => {
                    this._room.send(ServerMsg.PLAYER_USE_ITEM, inventory.i);
                },
            });
        }
        actions.push({
            title: "Drop Item(s)",
            click: () => {
                this._room.send(ServerMsg.PLAYER_DROP_ITEM, { slot: inventory.i, drop_all: true });
            },
        });

        if (inventory.qty > 1) {
            actions.push({
                title: "Drop One",
                click: () => {
                    this._room.send(ServerMsg.PLAYER_DROP_ITEM, { slot: inventory.i });
                },
            });
        }

        actions.push({
            title: "Cancel",
            click: () => {
                this.hideDropdown();
            },
        });

        rect.height = 22 * actions.length + "px";

        actions.forEach((action) => {
            const button = Button.CreateSimpleButton("but" + action.title, action.title);
            button.left = "2.5px";
            button.width = "95px";
            button.height = "22px";
            button.thickness = 0;
            button.textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            button.textBlock.fontSize = "12px";
            rect.addControl(button);
            button.onPointerDownObservable.add(() => {
                action.click();
                this.hideDropdown();
            });
        });
    }
}
