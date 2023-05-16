import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import Config from "../../../shared/Config";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { generatePanel } from "./Theme";

export class Tooltip {
    private _playerUI;
    private _currentPlayer;
    private _loadedAssets;
    private _scene: Scene;
    private _engine: Engine;

    private tooltipTarget;
    private tooltipContainer: Rectangle;
    private tooltipImage;
    private tooltipName;
    private tooltipDescription;

    constructor(_UI, _currentPlayer) {
        this._playerUI = _UI._playerUI;
        this._loadedAssets = _UI._loadedAssets;
        this._engine = _UI._engine;
        this._scene = _UI._scene;
        this._currentPlayer = _currentPlayer;

        // create basic tooltip ui
        this._createUI();

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {
            // refresh
            this._update();
        });
    }

    private _createUI() {
        const tooltipBar = generatePanel("tooltipBar", "150px;", "100px", "0px", "0px");
        tooltipBar.color = "#FFF";
        tooltipBar.isVisible = false;
        tooltipBar.adaptHeightToChildren = true;
        tooltipBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._playerUI.addControl(tooltipBar);
        this.tooltipContainer = tooltipBar;

        const tooltipBarStack = new StackPanel("tooltipBarStack");
        tooltipBarStack.width = 1;
        tooltipBarStack.setPaddingInPixels(5, 5, 5, 5);
        tooltipBar.addControl(tooltipBarStack);

        let headerHeight = "30px";
        let tooltipHeader = new Rectangle("tooltipHeader");
        tooltipHeader.thickness = 0;
        tooltipHeader.height = headerHeight;
        tooltipHeader.adaptHeightToChildren = true;
        tooltipHeader.paddingBottom = "5px";
        tooltipBarStack.addControl(tooltipHeader);

        const tooltipImage = new Rectangle("tooltipImage");
        tooltipImage.top = "0x";
        tooltipImage.left = "0x";
        tooltipImage.width = headerHeight;
        tooltipImage.height = headerHeight;
        tooltipImage.thickness = 1;
        tooltipImage.background = Config.UI_CENTER_PANEL_BG;
        tooltipImage.isVisible = true;
        tooltipImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipHeader.addControl(tooltipImage);
        this.tooltipImage = tooltipImage;

        // add name
        const tooltipName = new TextBlock("tooltipName");
        tooltipName.color = "#FFF";
        tooltipName.top = "0px";
        tooltipName.left = "35px";
        tooltipName.fontSize = "12px;";
        tooltipName.resizeToFit = true;
        tooltipName.text = "Item Name";
        tooltipName.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipName.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipName.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipHeader.addControl(tooltipName);
        this.tooltipName = tooltipName;

        // add description
        const tooltipDescription = new TextBlock("tooltipDescription");
        tooltipDescription.color = "#FFF";
        tooltipDescription.top = "0px";
        tooltipDescription.left = "0px";
        tooltipDescription.width = 1;
        tooltipDescription.fontSize = "11px;";
        tooltipDescription.resizeToFit = true;
        tooltipDescription.text = "";
        tooltipDescription.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipDescription.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipDescription.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipDescription.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipDescription.textWrapping = TextWrapping.WordWrap;
        tooltipBarStack.addControl(tooltipDescription);
        this.tooltipDescription = tooltipDescription;
    }

    private generateItem(data) {
        this.tooltipName.text = data.name;
        this.tooltipDescription.text = data.description;
    }

    private generateAbility(data) {
        this.tooltipName.text = data.label;
        this.tooltipDescription.text = data.description;
    }

    /** called externally to refresh tooltip with content */
    public refresh(type, data, el: Rectangle) {
        // set tooltip target
        this.tooltipTarget = el;

        // position tooltip
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
            let heightOffset = this.tooltipContainer.heightInPixels + this.tooltipTarget.heightInPixels / 2;
            let widthOffset = this.tooltipTarget.widthInPixels / 2;
            let x = this.tooltipTarget.centerX;
            let y = this.tooltipTarget.centerY;
            this.tooltipContainer.leftInPixels = x - widthOffset; //slight offset
            this.tooltipContainer.topInPixels = y - heightOffset; //slight offset
        }
    }

    private _update() {}
}
