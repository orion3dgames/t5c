import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Panel } from "./Panel";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { applyTheme, createButton } from "../Theme";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { ServerMsg } from "../../../../shared/types";
import { Rarity } from "../../../../shared/Class/Rarity";

export class Panel_Character extends Panel {
    // inventory tab
    private panel: Rectangle;
    private attributes;
    private stats;
    private slots;

    private leftPanel: Rectangle;
    private rightPanel: Rectangle;
    private slotPanel: Rectangle;

    constructor(_UI, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);

        //
        this.attributes = {
            strength: {
                name: "Strength",
                button: true,
            },
            endurance: {
                name: "Endurance",
                button: true,
            },
            agility: {
                name: "Agility",
                button: true,
            },
            intelligence: {
                name: "Intelligence",
                button: true,
            },
            wisdom: {
                name: "Wisdom",
                button: true,
            },
            ac: {
                name: "AC",
                button: false,
            },
            points: {
                name: "Available Points",
            },
        };

        //
        this.stats = {
            name: {
                label: "Name",
                value: this._currentPlayer.name,
            },
            sessionId: {
                label: "ID",
                value: this._currentPlayer.sessionId,
            },
            level: {
                label: "Level",
                value: this._currentPlayer.level,
            },
            race: {
                label: "Race",
                value: this._currentPlayer.race,
            },
            health: {
                label: "Health",
                value: this._currentPlayer.health + "/" + this._currentPlayer.maxHealth,
            },
            mana: {
                label: "Mana",
                value: this._currentPlayer.mana + "/" + this._currentPlayer.maxMana,
            },
        };

        this.slots = [
            "HEAD",
            "AMULET",
            "CHEST", "PANTS", "SHOES", "WEAPON", "OFF_HAND", "RING_1", "RING_2", "BACK",];

        // create UI
        this.createPanels();
        this.createContent();

        // dynamic events
        let entity = this._currentPlayer.entity;
        if (entity) {
            entity.player_data.onChange((item, sessionId) => {
                this.leftPanelContent(this.leftPanel);
                this.rightPanelContent(this.rightPanel);
            });
            entity.equipment.onAdd((item, sessionId) => {
                this.slotPanelContentRefresh("ADD", this.slotPanel, item);
            });
            entity.equipment.onRemove((item, sessionId) => {
                this.slotPanelContentRefresh("REMOVE", this.slotPanel, item);
            });
        }
    }

    // open panel
    public open() {
        super.open();
    }

    // create content
    public createContent() {
        this.leftPanelContent(this.leftPanel);
        this.rightPanelContent(this.rightPanel);
        this.slotPanelContent(this.slotPanel);
    }

    // create panel
    private createPanels() {
        let panel: Rectangle = this._panelContent;

        // left panel
        let leftPanel = new Rectangle("leftPanel");
        leftPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        leftPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        leftPanel.top = "0px";
        leftPanel.left = "0px;";
        leftPanel.width = 0.485;
        leftPanel.height = 0.8;
        leftPanel.thickness = 0;
        leftPanel.paddingLeft = "0px;";
        leftPanel.paddingBottom = "5px;";
        panel.addControl(leftPanel);
        this.leftPanel = leftPanel;

        // right panel
        let rightPanel = new Rectangle("rightPanel");
        rightPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        rightPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        rightPanel.top = "0px";
        rightPanel.left = "0px";
        rightPanel.width = 0.485;
        rightPanel.height = 0.8;
        rightPanel.thickness = 0;
        rightPanel.paddingLeft = "0px;";
        rightPanel.paddingBottom = "5px;";
        panel.addControl(rightPanel);
        this.rightPanel = rightPanel;

        // bottom panel
        let slotPanel = new Rectangle("slotPanel");
        slotPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        slotPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        slotPanel.top = "0px";
        slotPanel.left = "0px";
        slotPanel.width = 1;
        slotPanel.adaptHeightToChildren = true;
        slotPanel.thickness = 0;
        slotPanel.paddingLeft = "7px;";
        slotPanel.paddingRight = "7px;";
        slotPanel.paddingBottom = "7px;";
        panel.addControl(slotPanel);
        this.slotPanel = slotPanel;
    }

    private leftPanelContent(panel) {
        // if already exists
        panel.children.forEach((el) => {
            el.dispose();
        });

        // panel title
        const stackPanel = new StackPanel("stackPanel");
        stackPanel.width = 1;
        stackPanel.adaptHeightToChildren = true;
        stackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        stackPanel.setPaddingInPixels(5, 5, 5, 5);
        panel.addControl(stackPanel);

        for (let key in this.stats) {
            // get ability details
            let line = this.stats[key];

            let panelRectangle = new Rectangle("cont" + key);
            panelRectangle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            panelRectangle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            panelRectangle.top = "0px";
            panelRectangle.left = "0px;";
            panelRectangle.width = 1;
            panelRectangle.height = "30px";
            panelRectangle.background = "#CCC";
            panelRectangle.thickness = 1;
            panelRectangle.paddingLeft = "0px;";
            panelRectangle.paddingBottom = "5px;";
            applyTheme(panelRectangle);
            stackPanel.addControl(panelRectangle);

            const tooltipName = new TextBlock("name" + key);
            tooltipName.color = "#FFF";
            tooltipName.top = "0px";
            tooltipName.left = "5px";
            tooltipName.fontSize = "14px;";
            tooltipName.resizeToFit = true;
            tooltipName.text = line.label;
            tooltipName.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            tooltipName.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            tooltipName.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            tooltipName.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            panelRectangle.addControl(tooltipName);

            const valueText = new TextBlock("valueText" + key);
            valueText.color = "#FFF";
            valueText.top = "0px";
            valueText.left = "-5px";
            valueText.fontSize = "14px;";
            valueText.resizeToFit = true;
            valueText.text = line.value;
            valueText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            valueText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            valueText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            valueText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            panelRectangle.addControl(valueText);
        }
    }

    private rightPanelContent(panel) {
        // if already exists
        panel.children.forEach((el) => {
            el.dispose();
        });

        // panel title
        const stackPanel = new StackPanel("stackPanel");
        stackPanel.width = 1;
        stackPanel.adaptHeightToChildren = true;
        stackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        stackPanel.setPaddingInPixels(5, 5, 5, 5);
        panel.addControl(stackPanel);

        for (let key in this.attributes) {
            // get ability details
            let line = this.attributes[key];

            let panelRectangle = new Rectangle("cont" + key);
            panelRectangle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            panelRectangle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            panelRectangle.top = "0px";
            panelRectangle.left = "0px;";
            panelRectangle.width = 1;
            panelRectangle.height = "30px";
            panelRectangle.background = "#CCC";
            panelRectangle.thickness = 1;
            panelRectangle.paddingLeft = "0px;";
            panelRectangle.paddingBottom = "5px;";
            applyTheme(panelRectangle);
            stackPanel.addControl(panelRectangle);

            const tooltipName = new TextBlock("name" + key);
            tooltipName.color = "#FFF";
            tooltipName.top = "0px";
            tooltipName.left = "5px";
            tooltipName.fontSize = "14px;";
            tooltipName.resizeToFit = true;
            tooltipName.text = line.name;
            tooltipName.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            tooltipName.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            tooltipName.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            tooltipName.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            panelRectangle.addControl(tooltipName);

            const valueText = new TextBlock("valueText" + key);
            valueText.color = "#FFF";
            valueText.top = "0px";
            valueText.left = "-5px";
            valueText.fontSize = "14px;";
            valueText.resizeToFit = true;
            valueText.text = this._currentPlayer.player_data[key] ?? "ERROR";
            valueText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            valueText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            valueText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            valueText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            panelRectangle.addControl(valueText);

            //
            if (line.button && this._currentPlayer.player_data.points > 0) {
                let button = createButton("button", "+", "20px", "20px");
                button.background = "green";
                button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
                button.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                panelRectangle.addControl(button);
                button.onPointerDownObservable.add(() => {
                    this._game.sendMessage(ServerMsg.PLAYER_ADD_STAT_POINT, {
                        key: key,
                    });
                });

                // push the value text to the left
                valueText.left = "-30px";
            }
        }
    }

    private slotPanelContent(panel: Rectangle) {
        let width = 484;

        let i = 0;
        this.slots.forEach((line) => {
            i++;

            // calculate responsive width and height
            let iconGutter = 4;
            let iconWidth = width / this.slots.length - iconGutter;
            let iconLeft = iconWidth + iconGutter;
            let leftMargin = i > 1 ? (i - 1) * iconLeft + "px" : "0px";

            let panelRectangle = new Rectangle("slot_" + i);
            panelRectangle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            panelRectangle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            panelRectangle.top = "0px";
            panelRectangle.left = leftMargin;
            panelRectangle.width = iconWidth + "px";
            panelRectangle.height = iconWidth + "px";
            panelRectangle.thickness = 2;
            panelRectangle.color = "rgba(255,255,255, .3";
            panel.addControl(panelRectangle);

            var panelText = new TextBlock("slot_text_" + i);
            panelText.text = line;
            panelText.fontSize = "10px";
            panelText.color = "rgba(255,255,255, .3)";
            panelText.fontWeight = "bold";
            panelText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            panelText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            panelRectangle.addControl(panelText);

            // add icon
            var img = new Image("slot_image_" + i, "./");
            img.stretch = Image.STRETCH_FILL;
            panelRectangle.addControl(img);
        });
    }

    private slotPanelContentRefresh(type, panel: Rectangle, data) {
        // get information
        let slot_id = data.slot;
        let item_key = data.key;
        let slotPanel = panel.getChildByName("slot_" + slot_id) as Rectangle;
        let slotImage = slotPanel.getChildByName("slot_image_" + slot_id) as Image;
        let item = this._game.getGameData("item", item_key);

        // make sure to remove any exisiting events
        slotImage.source = "";
        slotPanel.onPointerClickObservable.clear();
        slotPanel.onPointerEnterObservable.clear();
        slotPanel.onPointerOutObservable.clear();

        // equip item
        if (type === "ADD") {
            // color based on rarity
            let color = Rarity.getColor(item);
            slotPanel.background = color.bg;
            slotPanel.color = color.color;
            slotPanel.thickness = 2;

            //
            var imageData = this._loadedAssets[item.icon];
            slotImage.source = imageData;

            slotPanel.onPointerClickObservable.add((e) => {
                if (e.buttonIndex === 2) {
                    this._game.sendMessage(ServerMsg.PLAYER_UNEQUIP_ITEM, {
                        key: item.key,
                    });
                }
            });

            slotPanel.onPointerEnterObservable.add((e) => {
                this._UI._Tooltip.refresh("item", item, slotPanel, "center", "top");
            });

            slotPanel.onPointerOutObservable.add((e) => {
                this._UI._Tooltip.close();
            });
        }

        if (type === "REMOVE") {
            slotPanel.background = "transparent";
            slotPanel.color = "rgba(255,255,255, .3";
        }
    }
}
