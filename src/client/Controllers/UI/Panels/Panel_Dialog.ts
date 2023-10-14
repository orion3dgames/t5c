import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { Panel } from "./Panel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { UserInterface } from "../../UserInterface";

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
    public dialogStackPanel: StackPanel;

    public currentEntity;
    public currentDialog;
    public currentQuest;
    public currentDialogStep: number = -1;

    constructor(_UI: UserInterface, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);

        this.createContent();
    }

    public open(type?: any, entity?: any) {
        super.open();

        if (entity) {
            this.currentEntity = entity;
            this.currentDialog = entity.spwanInfo.interactable[type].data;
            this.currentDialogStep = 0;

            this._panelTitle.text = entity.name;

            this.nextStep(this.currentDialogStep);
        }
    }

    clear() {
        this.dialogStackPanel.getDescendants().forEach((el) => {
            el.dispose();
        });
    }

    public replaceKeywords(text) {
        text = text.replace("@NpcName", this.currentEntity.name);
        text = text.replace("@LocationName", this._game.currentLocation.title);
        text = text.replace("@PlayerName", this._currentPlayer.name);
        if (this.currentQuest) {
            text = text.replace("@KillAmount", this.currentQuest.quantity);
            text = text.replace("@KillName", this.currentQuest.spawn_type);
        }
        return text;
    }

    public nextStep(step) {
        if (!this.currentDialog[step]) {
            this.close();
        }

        // clear dialog
        this.clear();

        // get vars
        let currentDialog = this.currentDialog[step];
        this.currentQuest = this._game.currentLocation.dynamic.quests[currentDialog.quest] ?? false;

        console.log("currentDialog", currentDialog, this.currentQuest);

        // add main text to dialog
        let dialogText = "";
        if (currentDialog.type === "text") {
            dialogText = currentDialog.text;
        }
        if (currentDialog.type === "quest") {
            dialogText = this.currentQuest.description;
        }
        dialogText = this.replaceKeywords(dialogText);

        let dialogTextBlock = new TextBlock("dialogText");
        dialogTextBlock.text = dialogText;
        dialogTextBlock.textHorizontalAlignment = 0;
        dialogTextBlock.fontSize = "14px";
        dialogTextBlock.color = "white";
        dialogTextBlock.textWrapping = TextWrapping.WordWrap;
        dialogTextBlock.resizeToFit = true;
        dialogTextBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        dialogTextBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.dialogStackPanel.addControl(dialogTextBlock);

        // if quest has an objective
        // probably always have, we will see later
        if (this.currentQuest && this.currentQuest.objective) {
            let dialogObjective = new TextBlock("dialogObjective");
            dialogObjective.text = this.replaceKeywords(this.currentQuest.objective);
            dialogObjective.textHorizontalAlignment = 0;
            dialogObjective.fontSize = "14px";
            dialogObjective.color = "orange";
            dialogObjective.textWrapping = TextWrapping.WordWrap;
            dialogObjective.resizeToFit = true;
            dialogObjective.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            dialogObjective.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            this.dialogStackPanel.addControl(dialogObjective);
        }

        // conditions
        if (currentDialog.isEndOfDialog) {
            let buttonName = currentDialog.buttonName ?? "Bye";

            const createBtn = Button.CreateSimpleButton("characterBtn", buttonName);
            createBtn.left = "0px;";
            createBtn.top = "0px";
            createBtn.width = 1;
            createBtn.height = "24px";
            createBtn.background = "black";
            createBtn.color = "white";
            createBtn.thickness = 0;
            createBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            createBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            this.dialogStackPanel.addControl(createBtn);

            createBtn.onPointerDownObservable.add(() => {
                this.close();
            });

            // if event
            if (currentDialog.triggeredByClosing) {
                this.processEvent(currentDialog.triggeredByClosing);
            }
        } else if (currentDialog.buttons) {
            // create buttons
            let i = 1;
            currentDialog.buttons.forEach((btn: any) => {
                let label = btn.label;
                if (btn.isQuest) {
                    label = label + "(QUEST)";
                }

                const createBtn = Button.CreateSimpleButton("characterBtn-" + i, btn.label);
                createBtn.left = "0px;";
                createBtn.top = "0px";
                createBtn.width = 1;
                createBtn.height = "24px";
                createBtn.background = "black";
                createBtn.color = "white";
                createBtn.thickness = 0;
                createBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                createBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                this.dialogStackPanel.addControl(createBtn);

                createBtn.onPointerDownObservable.add(() => {
                    this.nextStep(btn.goToDialog);
                });

                i++;
            });
        }
    }

    public processEvent(event) {
        if (event.type === "cast_ability") {
            this._currentPlayer.actionsController.process(
                this._currentPlayer,
                {
                    key: event.ability,
                    fromId: this.currentEntity.sessionId,
                    fromPos: this.currentEntity.getPosition(),
                    targetId: this._currentPlayer.sessionId,
                    targetPos: this._currentPlayer.getPosition(),
                },
                this._game.getGameData("ability", event.ability)
            );
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
        dialogPanel.adaptHeightToChildren = true;
        dialogPanel.background = "rgba(255,255,255,.1)";
        panel.addControl(dialogPanel);

        // add scrollable container
        const chatStackPanel = new StackPanel("chatStackPanel");
        chatStackPanel.width = "100%";
        chatStackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        chatStackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        chatStackPanel.paddingTop = "5px;";
        chatStackPanel.spacing = 5;
        dialogPanel.addControl(chatStackPanel);
        this.dialogStackPanel = chatStackPanel;
    }
}
