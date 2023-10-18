import { Control } from "@babylonjs/gui/2D/controls/control";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Panel_Dialog } from "../..";
import { Ability, ServerMsg } from "../../../../../shared/types";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { CubicEase, EasingFunction } from "@babylonjs/core/Animations/easing";
import { Animation } from "@babylonjs/core/Animations/animation";

export class Vendor {
    private panel: Panel_Dialog;
    private currentDialog;
    private panelDetails;
    private stackPanel: StackPanel;
    private selected;

    private backgroundColor = "#292929";
    private backgroundSelected = "green";

    constructor(panel: Panel_Dialog, currentDialog) {
        this.panel = panel;
        this.currentDialog = currentDialog;
        this.refresh();
    }

    refresh() {
        this.panel._panelContent.getDescendants().forEach((el) => {
            el.dispose();
        });

        // create ui
        this.create();
    }

    create() {
        const createBtn = Button.CreateSimpleButton("characterBtn", "Back");
        createBtn.left = "0px;";
        createBtn.top = "0px";
        createBtn.width = 1;
        createBtn.height = "24px";
        createBtn.background = "black";
        createBtn.color = "white";
        createBtn.thickness = 0;
        createBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        createBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.panel._panelContent.addControl(createBtn);

        createBtn.onPointerDownObservable.add(() => {
            this.panel.nextStep(0);
        });

        // add scrollable container
        const scrollViewer = new ScrollViewer("scrollViewer");
        scrollViewer.width = 1;
        scrollViewer.height = 0.63;
        scrollViewer.top = "24px;";
        scrollViewer.thickness = 0;
        scrollViewer.background = this.backgroundColor;
        scrollViewer.setPaddingInPixels(5, 5, 5, 5);
        scrollViewer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        scrollViewer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.panel._panelContent.addControl(scrollViewer);

        // add details scrollable container
        const scrollViewerDetails = new ScrollViewer("scrollViewerDetails");
        scrollViewerDetails.width = 1;
        scrollViewerDetails.height = 0.3;
        scrollViewerDetails.top = -0.1;
        scrollViewerDetails.thickness = 0;
        scrollViewerDetails.setPaddingInPixels(5, 5, 5, 5);
        scrollViewerDetails.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        scrollViewerDetails.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.panel._panelContent.addControl(scrollViewerDetails);
        this.panelDetails = scrollViewerDetails;

        // add detail window
        const stackPanel = new StackPanel("stackPanel");
        stackPanel.width = 1;
        stackPanel.height = 1;
        stackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        stackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        stackPanel.spacing = 0;
        stackPanel.adaptHeightToChildren = true;
        scrollViewer.addControl(stackPanel);
        this.stackPanel = stackPanel;

        if (this.currentDialog.items.length > 0) {
            this.currentDialog.items.forEach((a) => {
                let item = this.panel._game.getGameData("item", a.key);
                item.cost = a.cost;

                let blocContainer = new Rectangle("blocContainer");
                blocContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                blocContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                blocContainer.top = "0px";
                blocContainer.left = "0px;";
                blocContainer.width = 1;
                blocContainer.height = "25px";
                blocContainer.background = this.backgroundColor;
                blocContainer.thickness = 0;
                blocContainer.metadata = {
                    item: item,
                };
                stackPanel.addControl(blocContainer);

                var blockTitle = new TextBlock("blockTitle");
                blockTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                blockTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                blockTitle.paddingLeft = "5px";
                blockTitle.text = item.title;
                blockTitle.fontSize = "14px";
                blockTitle.color = "white";
                blockTitle.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                blockTitle.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                blocContainer.addControl(blockTitle);

                // on hover tooltip
                blocContainer.onPointerClickObservable.add(() => {
                    this.select(blocContainer, blockTitle);
                    this.createDetails(item);
                });
            });

            // select first available ability
            let firstElement = this.stackPanel.children[0] as Rectangle;
            let item = this.panel._game.getGameData("item", this.currentDialog.items[0].key);
            this.select(this.stackPanel.children[0], firstElement.children[0]);
            this.createDetails(item);
        } else {
            // nothing available to learn, show empty message
            const tooltipName = new TextBlock("emptyText");
            tooltipName.color = "#FFF";
            tooltipName.top = "5px";
            tooltipName.left = "5px";
            tooltipName.resizeToFit = true;
            tooltipName.text = "Sorry, you've already leant all I had to teach.";
            tooltipName.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            tooltipName.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            tooltipName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            tooltipName.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            tooltipName.textWrapping = TextWrapping.WordWrap;
            stackPanel.addControl(tooltipName);
        }
    }

    select(blocContainer, blockTitle) {
        // reset all
        this.stackPanel.children.forEach((el: any) => {
            el.background = this.backgroundColor;
        });

        // color selected line
        blocContainer.background = "green";
        blockTitle.color = "white";
    }

    createDetails(item) {
        // clear previous ability
        this.panelDetails.getDescendants().forEach((el) => {
            el.dispose();
        });

        const stackPanel = new StackPanel("stackPanel");
        stackPanel.width = 1;
        stackPanel.height = 1;
        stackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        stackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        stackPanel.spacing = 5;
        stackPanel.adaptHeightToChildren = true;
        this.panelDetails.addControl(stackPanel);

        let titleBloc = new Rectangle("titleBloc" + item.key);
        titleBloc.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        titleBloc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        titleBloc.top = "5px";
        titleBloc.left = "0px;";
        titleBloc.width = 1;
        titleBloc.height = "35px;";
        titleBloc.thickness = 0;
        stackPanel.addControl(titleBloc);

        const createBtn = Button.CreateSimpleButton("learnBTN", "Buy");
        createBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        createBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        createBtn.left = "-5px;";
        createBtn.top = "5px";
        createBtn.width = "50px;";
        createBtn.height = "20px";
        createBtn.background = "orange";
        createBtn.color = "white";
        createBtn.thickness = 0;
        titleBloc.addControl(createBtn);

        let clicked = false;
        let observable = createBtn.onPointerClickObservable.add(() => {
            if (clicked === false) {
                clicked = true;
                this.panel._room.send(ServerMsg.PLAYER_BUY_ITEM, item.key);
                if (createBtn.textBlock) {
                    createBtn.textBlock.text = "...";
                }
                // todo: we need some sort of callback here
                setTimeout(() => {
                    clicked = false;
                    if (createBtn.textBlock) {
                        createBtn.textBlock.text = "Buy";
                    }
                }, 500);
            }
        });

        // add icon + title
        let imageBLoc = new Rectangle("imageBLoc" + item.key);
        imageBLoc.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        imageBLoc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        imageBLoc.top = "0px";
        imageBLoc.left = "0px;";
        imageBLoc.width = "30px;";
        imageBLoc.height = "30px;";
        imageBLoc.thickness = 0;
        titleBloc.addControl(imageBLoc);

        var imageData = this.panel._loadedAssets[item.icon];
        var img = new Image("itemImage_" + item.key, imageData);
        img.stretch = Image.STRETCH_FILL;
        imageBLoc.addControl(img);

        // add title
        const tooltipName = new TextBlock("abilityName" + item.key);
        tooltipName.color = "#FFF";
        tooltipName.top = "5px";
        tooltipName.left = "40px";
        tooltipName.fontSize = "18px;";
        tooltipName.resizeToFit = true;
        tooltipName.text = item.title;
        tooltipName.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipName.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        tooltipName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipName.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        titleBloc.addControl(tooltipName);

        // addd description
        const abilityDescr = new TextBlock("abilityDescr" + item.key);
        abilityDescr.color = "rgba(255,255,255,.6)";
        abilityDescr.top = 0;
        abilityDescr.left = "0px";
        abilityDescr.fontSize = "12px;";
        abilityDescr.textWrapping = TextWrapping.WordWrap;
        abilityDescr.resizeToFit = true;
        abilityDescr.text = item.description;
        abilityDescr.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        abilityDescr.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        abilityDescr.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        abilityDescr.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        stackPanel.addControl(abilityDescr);

        // add requirements
        let requirements = "";
        if (item.cost) {
            requirements += "Cost: " + item.cost + "\n";
        }

        const requiredBloc = new TextBlock("requiredBloc" + item.key);
        requiredBloc.color = "rgba(255,255,255,.6)";
        requiredBloc.top = 0;
        requiredBloc.left = "0px";
        requiredBloc.fontSize = "12px;";
        requiredBloc.color = "orange";
        requiredBloc.textWrapping = TextWrapping.WordWrap;
        requiredBloc.resizeToFit = true;
        requiredBloc.text = requirements;
        requiredBloc.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        requiredBloc.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        requiredBloc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        requiredBloc.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        stackPanel.addControl(requiredBloc);
    }
}
