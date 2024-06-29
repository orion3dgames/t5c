import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { generatePanel } from "./Theme";
import { GameController } from "../GameController";
import { CalculationTypes } from "../../../shared/types";
import { Rarity } from "../../../shared/Class/Rarity";

export class Tooltip {
    private _playerUI;
    private _game: GameController;
    private _currentPlayer;
    private _loadedAssets;
    private _scene: Scene;
    private _engine: Engine;

    private tooltipTarget;
    private tooltipContainer: Rectangle;
    private tooltipImage;
    private tooltipName;
    private tooltipDescription;
    private tooltipStats;
    private tooltipValue;

    private horizontal = "center";
    private vertical = "top";

    constructor(_UI, _currentPlayer) {
        this._game = _UI._game;
        this._playerUI = _UI._playerUI;
        this._loadedAssets = _UI._loadedAssets;
        this._engine = _UI._engine;
        this._scene = _UI._scene;
        this._currentPlayer = _currentPlayer;

        // create basic tooltip ui
        this._createUI();
    }

    private _createUI() {
        const tooltipBar = generatePanel("tooltipBar", "200px;", "200px", "0px", "0px");
        tooltipBar.background = "#222222";
        tooltipBar.isVisible = false;
        tooltipBar.adaptHeightToChildren = true;
        tooltipBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipBar.zIndex = 50;
        this._playerUI.addControl(tooltipBar);
        this.tooltipContainer = tooltipBar;

        const tooltipBarStack = new StackPanel("tooltipBarStack");
        tooltipBarStack.width = 1;
        tooltipBarStack.setPaddingInPixels(5, 5, 5, 5);
        tooltipBar.addControl(tooltipBarStack);

        let headerHeight = "35px";
        let tooltipHeader = new Rectangle("tooltipHeader");
        tooltipHeader.thickness = 0;
        tooltipHeader.height = headerHeight;
        tooltipHeader.paddingBottom = "5px";
        tooltipBarStack.addControl(tooltipHeader);

        const tooltipImage = new Rectangle("tooltipImage");
        tooltipImage.top = "2px";
        tooltipImage.left = "0x";
        tooltipImage.width = "25px";
        tooltipImage.height = "25px";
        tooltipImage.thickness = 0;
        tooltipImage.background = this._game.config.UI_CENTER_PANEL_BG;
        tooltipImage.isVisible = true;
        tooltipImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipHeader.addControl(tooltipImage);
        this.tooltipImage = tooltipImage;

        // add name
        const tooltipName = new TextBlock("tooltipName");
        tooltipName.width = 0.8;
        tooltipName.color = "#FFF";
        tooltipName.top = "4px";
        tooltipName.left = "30px";
        tooltipName.fontSize = "16px;";
        tooltipName.resizeToFit = true;
        tooltipName.text = "Item Name";
        tooltipName.fontWeight = "bold";
        tooltipName.lineSpacing = "-2";
        tooltipName.textWrapping = TextWrapping.WordWrapEllipsis;
        tooltipName.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipName.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipName.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipHeader.addControl(tooltipName);
        this.tooltipName = tooltipName;

        //
        const tooltipStats = new TextBlock("tooltipStats");
        tooltipStats.color = "green";
        tooltipStats.top = "0px";
        tooltipStats.left = "0px";
        tooltipStats.fontSize = "14px;";
        tooltipStats.resizeToFit = true;
        tooltipStats.fontWeight = "bold";
        tooltipStats.text = "";
        tooltipStats.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipStats.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipStats.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipStats.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipBarStack.addControl(tooltipStats);
        this.tooltipStats = tooltipStats;

        // add description
        const tooltipDescription = new TextBlock("tooltipDescription");
        tooltipDescription.color = "#FFF";
        tooltipDescription.top = "0px";
        tooltipDescription.left = "0px";
        tooltipDescription.width = 1;
        tooltipDescription.fontSize = "14px;";
        tooltipDescription.resizeToFit = true;
        tooltipDescription.text = "";
        tooltipDescription.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipDescription.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipDescription.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipDescription.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipDescription.textWrapping = TextWrapping.WordWrap;
        tooltipDescription.paddingBottom = "5px";
        tooltipBarStack.addControl(tooltipDescription);
        this.tooltipDescription = tooltipDescription;

        // add value
        const tooltipValue = new TextBlock("tooltipValue");
        tooltipValue.color = "gray";
        tooltipValue.top = "0px";
        tooltipValue.left = "0px";
        tooltipValue.width = 1;
        tooltipValue.fontSize = "12px;";
        tooltipValue.resizeToFit = true;
        tooltipValue.text = "";
        tooltipValue.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipValue.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipValue.textWrapping = TextWrapping.WordWrap;
        tooltipBarStack.addControl(tooltipValue);
        this.tooltipValue = tooltipValue;
    }

    private generateItem(data) {
        this.tooltipName.text = data.title;
        this.tooltipDescription.text = data.description;

        this.tooltipValue.isVisible = true;
        this.tooltipValue.text = "Value: " + data.value;

        //
        let stats = "";
        for (let key in data.statModifiers) {
            for (let line of data.statModifiers[key]) {
                let title = key.toUpperCase() + ": ";
                if (line.type === CalculationTypes.ADD) {
                    stats += title + " + " + line.value + "\n";
                } else if (line.type === CalculationTypes.MULTIPLY) {
                    stats += title + " + " + line.value * 10 + "% \n";
                }
            }
        }

        // if damage
        if(data.damage){
            stats += "Damage: "+data.damage.min+" - "+data.damage.max+" \n";
        }

        stats = stats.slice(0, -1);
        this.tooltipStats.text = stats;
        this.tooltipStats.isVisible = stats === "" ? false : true;


        // color based on rarity
        this.tooltipContainer.color = Rarity.getColor(data).color;
        this.tooltipName.color = Rarity.getTooltipColor(data, 1);
    }

    private generateAbility(data) {
        this.tooltipName.text = data.title;
        this.tooltipDescription.text = data.description;

        // hide value
        this.tooltipValue.text = "0";
        this.tooltipValue.isVisible = false;

        // generate ability stats
        let stats = "";
        if (data.casterPropertyAffected.length > 0) {
            data.casterPropertyAffected.forEach((element) => {
                stats += "Cost: " + element.min + "-" + element.max + " " + element.key.toUpperCase() + "\n";
            });
        }

        if (data.cooldown > 0) {
            stats += "Cooldown: " + data.cooldown / 1000 + "s\n";
        }

        if (data.castTime > 0) {
            stats += "Cast time: " + data.castTime / 1000 + "s\n";
        } else {
            stats += "Instant Cast\n";
        }

        stats = stats.slice(0, -1);
        this.tooltipStats.text = stats;

        // color based on rarity
        this.tooltipContainer.color = Rarity.getColor(false).color;
        this.tooltipName.color = Rarity.getTooltipColor(false, 1);
    }

    /** called externally to refresh tooltip with content */
    public refresh(type, data, el: Rectangle, horizontal = "left", vertical = "center") {
        // set tooltip target
        this.tooltipTarget = el;

        // position tooltip
        this.horizontal = horizontal;
        this.vertical = vertical;

        this.setPosition();

        // remove image
        this.tooltipImage.children.forEach((element) => {
            element.dispose();
        });

        // add image
        var imageData = this._loadedAssets[data.icon];
        var img = new Image("tooltipImageImg", imageData);
        img.stretch = Image.STRETCH_FILL;
        this.tooltipImage.addControl(img);

        switch (type) {
            case "item":
                this.generateItem(data);
                break;
            case "ability":
                this.generateAbility(data);
                break;
        }

        // show tooltip
        this.tooltipContainer.isVisible = true;
    }

    /** called externally to hide tooltip */
    public close() {
        this.tooltipContainer.isVisible = false;
        this.tooltipTarget = null;
    }

    private setPosition() {
        if (this.tooltipTarget) {
            let tooltipHeight = this.tooltipContainer.heightInPixels;
            let tooltipWidth = this.tooltipContainer.widthInPixels;
            let targetHeight = this.tooltipTarget.heightInPixels;
            let targetWidth = this.tooltipTarget.widthInPixels;
            let x = this.tooltipTarget.centerX;
            let y = this.tooltipTarget.centerY;

            if (this.horizontal === "left") {
                x -= targetWidth / 2 + tooltipWidth;
            }

            if (this.horizontal === "center") {
                x -= tooltipWidth / 2;
            }

            if (this.horizontal === "right") {
                x += targetWidth / 2;
            }

            if (this.vertical === "top") {
                y -= targetHeight / 2 + tooltipHeight;
            }

            if (this.vertical === "center") {
                y -= tooltipHeight / 2;
            }

            if (this.vertical === "bottom") {
                y += targetHeight / 2;
            }

            this.tooltipContainer.leftInPixels = x;
            this.tooltipContainer.topInPixels = y;
        }
    }

    public update() {
        this.setPosition();
    }
}
