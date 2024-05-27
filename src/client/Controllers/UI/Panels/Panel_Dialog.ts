import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Panel } from "./Panel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { UserInterface } from "../../UserInterface";

import { TrainerDialog } from "./Dialog/TrainerDialog";
import { VendorDialog } from "./Dialog/VendorDialog";
import { QuestDialog } from "./Dialog/QuestDialog";

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
    public currentDialogStep: number = -1;

    constructor(_UI: UserInterface, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);

        this.createContent();
    }

    public open(entity?: any) {
        super.open();

        if (entity) {
            this.currentEntity = entity;
            this.currentDialog = entity.spawnInfo.interactable.data;
            this.currentDialogStep = 0;

            this._panelTitle.text = entity.name;

            this.nextStep(this.currentDialogStep);
        }
    }

    clear() {
        this._panelContent.getDescendants().forEach((el) => {
            el.dispose();
        });
        this.createContent();
    }

    public showTrainer(trainer) {
        this.clear();
        this.trainer = new TrainerDialog(this, trainer);
    }

    public showVendor(vendor) {
        this.clear();
        this.vendor = new VendorDialog(this, vendor);
    }

    public showQuest(quest_id: string) {
        this.clear();
        this.quest = new QuestDialog(this, quest_id);
    }

    public replaceKeywords(text) {
        text = text.replace("@NpcName", this.currentEntity.name);
        text = text.replace("@LocationName", this._game.currentLocation.title);
        text = text.replace("@PlayerName", this._currentPlayer.name);
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

        // create main description textblock
        let dialogTextBlock = new TextBlock("dialogText");
        dialogTextBlock.text = "";
        dialogTextBlock.textHorizontalAlignment = 0;
        dialogTextBlock.fontSize = "14px";
        dialogTextBlock.color = "white";
        dialogTextBlock.textWrapping = TextWrapping.WordWrap;
        dialogTextBlock.resizeToFit = true;
        dialogTextBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        dialogTextBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.dialogStackPanel.addControl(dialogTextBlock);

        // if dialog is type "text"
        if (currentDialog.type === "text") {
            let dialogText = currentDialog.text;
            dialogText = this.replaceKeywords(dialogText);
            dialogTextBlock.text = dialogText;
        }

        // create any quest buttons
        if (currentDialog.quests) {
            let q = 1;
            currentDialog.quests.forEach((btn: any) => {
                let playerQuest = this._currentPlayer.player_data.quests[btn.key] ?? false;

                if (playerQuest && playerQuest.status === 1) return false;

                let quest = this._game.getGameData("quest", btn.key);
                let color = playerQuest && playerQuest.status === 1 ? "gray" : "orange";

                const createBtn = Button.CreateSimpleButton("questBtn-" + q, "! " + quest.title);
                createBtn.left = "0px;";
                createBtn.top = "0px";
                createBtn.width = 1;
                createBtn.height = "24px";
                createBtn.background = color;
                createBtn.color = "white";
                createBtn.thickness = 0;
                this.dialogStackPanel.addControl(createBtn);
                createBtn.onPointerDownObservable.add(() => {
                    this.showQuest(btn.key);
                });
                q++;
            });
        }

        // create any trainer buttons
        if (currentDialog.trainer) {
            const createBtn = Button.CreateSimpleButton("gotoVendor", "Can you train me?");
            createBtn.left = "0px;";
            createBtn.top = "0px";
            createBtn.width = 1;
            createBtn.height = "24px";
            createBtn.background = "black";
            createBtn.color = "white";
            createBtn.thickness = 0;
            this.dialogStackPanel.addControl(createBtn);
            createBtn.onPointerDownObservable.add(() => {
                this.showTrainer(currentDialog.trainer);
            });
        }

        // create any vendor buttons
        if (currentDialog.vendor) {
            const createBtn = Button.CreateSimpleButton("gotoVendor", "Can I see your wares?");
            createBtn.left = "0px;";
            createBtn.top = "0px";
            createBtn.width = 1;
            createBtn.height = "24px";
            createBtn.background = "black";
            createBtn.color = "white";
            createBtn.thickness = 0;
            this.dialogStackPanel.addControl(createBtn);
            createBtn.onPointerDownObservable.add(() => {
                this.showVendor(currentDialog.vendor);
            });
        }

        // create any other buttons
        if (currentDialog.buttons) {
            let i = 1;
            currentDialog.buttons.forEach((btn: any) => {
                let label = btn.label;
                if (btn.isQuest) {
                    label = label + " (QUEST)";
                }

                const createBtn = Button.CreateSimpleButton("characterBtn-" + i, label);
                createBtn.left = "0px;";
                createBtn.top = "0px";
                createBtn.width = 1;
                createBtn.height = "24px";
                createBtn.background = "black";
                createBtn.color = "white";
                createBtn.thickness = 0;
                this.dialogStackPanel.addControl(createBtn);

                createBtn.onPointerDownObservable.add(() => {
                    this.nextStep(btn.goToDialog);
                });

                i++;
            });
        }

        // if last dialog in array, show close button
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
            this.dialogStackPanel.addControl(createBtn);

            createBtn.onPointerDownObservable.add(() => {
                this.close();
            });

            // if event
            if (currentDialog.triggeredByClosing) {
                this.processEvent(currentDialog.triggeredByClosing);
            }
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
