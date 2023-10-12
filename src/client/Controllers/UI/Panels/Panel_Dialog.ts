import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { Panel } from "./Panel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";

export class Panel_Dialog extends Panel {
    // inventory tab
    private panel: Rectangle;
    private attributes;
    private stats;
    private slots;

    private leftPanel: Rectangle;
    private rightPanel: Rectangle;
    private slotPanel: Rectangle;

    public dialogText: TextBlock;
    public dialogButtonsPanel: Rectangle;

    public currentEntity;
    public currentDialog;
    public currentDialogStep: number = -1;

    constructor(_UI, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);

        this.createContent();
    }

    public open(type?: any, entity?: any) {
        super.open();

        if (entity) {
            this.currentEntity = entity;
            this.currentDialog = entity.spwanInfo.interactable[type].data;
            this.currentDialogStep = 0;
            this.nextStep(this.currentDialogStep);
        }
    }

    public nextStep(step) {
        if (!this.currentDialog[step]) {
            this.close();
        }

        console.log("nextStep", step);

        let currentDialog = this.currentDialog[step];

        this.dialogText.text = currentDialog.text;

        console.log("currentDialog", currentDialog);

        //
        this.dialogButtonsPanel.children.forEach((el) => {
            el.dispose();
        });

        if (currentDialog.isEndOfDialog) {
            const createBtn = Button.CreateSimpleButton("characterBtn", "Bye");
            createBtn.left = "0px;";
            createBtn.top = "0px";
            createBtn.width = "100px";
            createBtn.height = "30px";
            createBtn.background = "orange";
            createBtn.color = "white";
            createBtn.thickness = 1;
            createBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            createBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            this.dialogButtonsPanel.addControl(createBtn);

            createBtn.onPointerDownObservable.add(() => {
                this.close();
            });
        } else if (currentDialog.buttons) {
            // create buttons
            let left = 0;
            currentDialog.buttons.forEach((btn: any) => {
                const createBtn = Button.CreateSimpleButton("characterBtn-" + left, btn.label);
                createBtn.left = left + "px;";
                createBtn.top = "0px";
                createBtn.width = "100px";
                createBtn.height = "30px";
                createBtn.background = "orange";
                createBtn.color = "white";
                createBtn.thickness = 1;
                createBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                createBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                this.dialogButtonsPanel.addControl(createBtn);

                createBtn.onPointerDownObservable.add(() => {
                    this.nextStep(btn.goToDialog);
                });

                left += 110;
            });
        }
    }

    // create panel
    private async createContent() {
        let panel: Rectangle = this._panelContent;

        // dialog panel
        let dialogPanel = new Rectangle("dialogPanel");
        dialogPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        dialogPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        dialogPanel.top = "0px";
        dialogPanel.left = "0px;";
        dialogPanel.width = 1;
        dialogPanel.height = 0.85;
        dialogPanel.thickness = 0;
        dialogPanel.setPadding(5, 5, 5, 5);
        dialogPanel.background = "rgba(255,255,255,.1)";
        panel.addControl(dialogPanel);

        // add scrollable container
        const dialogScrollViewer = new ScrollViewer("dialogScrollViewer");
        dialogScrollViewer.width = 1;
        dialogScrollViewer.height = 1;
        dialogScrollViewer.thickness = 0;
        dialogScrollViewer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        dialogScrollViewer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        dialogPanel.addControl(dialogScrollViewer);

        var dialogText = new TextBlock("dialogText");
        dialogText.text = "Dialog Content";
        dialogText.textHorizontalAlignment = 0;
        dialogText.fontSize = "14px";
        dialogText.color = "white";
        dialogText.textWrapping = TextWrapping.WordWrap;
        dialogText.resizeToFit = true;
        dialogText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        dialogText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        dialogScrollViewer.addControl(dialogText);
        this.dialogText = dialogText;

        // buttons panel
        let dialogButtons = new Rectangle("dialogButtons");
        dialogButtons.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        dialogButtons.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        dialogButtons.top = "0";
        dialogButtons.left = "0px;";
        dialogButtons.width = 1;
        dialogButtons.height = "45px;";
        dialogButtons.thickness = 0;
        dialogButtons.setPadding(5, 5, 5, 5);
        dialogButtons.background = "rgba(255,255,255,.1)";
        panel.addControl(dialogButtons);
        this.dialogButtonsPanel = dialogButtons;
    }
}
