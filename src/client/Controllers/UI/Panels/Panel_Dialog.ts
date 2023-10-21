import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Panel } from "./Panel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { UserInterface } from "../../UserInterface";
import { QuestObjective, QuestStatus, ServerMsg } from "../../../../shared/types";
import { QuestSchema } from "../../../../server/rooms/schema";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";

import { Trainer } from "./Dialog/Trainer";
import { Vendor } from "./Dialog/Vendor";

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
    public playerQuest: QuestSchema;

    constructor(_UI: UserInterface, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);

        this.createContent();
    }

    public open(entity?: any) {
        super.open();

        if (entity) {
            this.currentEntity = entity;
            this.currentDialog = entity.spwanInfo.interactable.data;
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

    public replaceKeywords(text) {
        text = text.replace("@NpcName", this.currentEntity.name);
        text = text.replace("@LocationName", this._game.currentLocation.title);
        text = text.replace("@PlayerName", this._currentPlayer.name);
        if (this.currentQuest) {
            text = text.replace("@KillRequired", this.currentQuest.quantity);
            text = text.replace("@KillName", this.currentQuest.spawn_name);
        }
        if (this.playerQuest) {
            text = text.replace("@KillCompleted", this.playerQuest.qty);
        }
        if (this.playerQuest && this.currentQuest) {
            text = text.replace("@KillRemaining", this.currentQuest.quantity - this.playerQuest.qty);
        }

        return text;
    }

    public isQuestReadyToComplete() {
        if (this.playerQuest && this.currentQuest) {
            if (this.currentQuest.type === QuestObjective.KILL_AMOUNT && this.playerQuest.qty >= this.currentQuest.quantity && this.playerQuest.status === 0) {
                return true;
            }
        }
        return false;
    }

    public nextStep(step) {
        if (!this.currentDialog[step]) {
            this.close();
        }

        // clear dialog
        this.clear();

        // get vars
        let currentDialog = this.currentDialog[step];
        let lastDialogIndex = this.currentDialog.length - 1;

        // load quest details
        if (currentDialog.quest_id) {
            this.playerQuest = this._currentPlayer.player_data.quests[currentDialog.quest_id];
            this.currentQuest = this._game.getGameData("quest", currentDialog.quest_id);
        }
        let questCompleted = this.isQuestReadyToComplete();

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

        //////////////////////////////////
        // if dialog is type "vendor",
        if (currentDialog.type === "vendor") {
            this.vendor = new Vendor(this, currentDialog);
        }

        //////////////////////////////////
        // if dialog is type "trainer",
        if (currentDialog.type === "trainer") {
            this.trainer = new Trainer(this, currentDialog);
        }

        //////////////////////////////////
        // if dialog is type "quest",
        if (currentDialog.type === "quest") {
            // quest accepted
            if (this.playerQuest && this.playerQuest.status === 0) {
                let dialogText = this.currentQuest.descriptionOngoing;
                dialogText = this.replaceKeywords(dialogText);
                dialogTextBlock.text = dialogText;
                currentDialog.isEndOfDialog = true;
            }

            // quest ready to complete
            if (questCompleted) {
                let dialogText = this.currentQuest.descriptionReward;
                dialogText = this.replaceKeywords(dialogText);
                dialogTextBlock.text = dialogText;
                currentDialog.isEndOfDialog = false;

                // show rewards
                this.showRewards(this.currentQuest.rewards);

                // complete quest button
                const createBtn = Button.CreateSimpleButton("characterBtn", "Complete Quest");
                createBtn.left = "0px;";
                createBtn.top = "0px";
                createBtn.width = 1;
                createBtn.height = "24px";
                createBtn.background = "black";
                createBtn.color = "white";
                createBtn.thickness = 0;
                this.dialogStackPanel.addControl(createBtn);

                createBtn.onPointerDownObservable.add(() => {
                    // send event to server
                    this._room.send(ServerMsg.PLAYER_QUEST_UPDATE, {
                        id: currentDialog.quest_id,
                        status: QuestStatus.READY_TO_COMPLETE,
                    });
                    // close dialog
                    this.close();
                });
            }

            // quest completed
            if (this.playerQuest && this.playerQuest.status === 1) {
                let dialogText = this.currentQuest.descriptionCompleted;
                dialogText = this.replaceKeywords(dialogText);
                dialogTextBlock.text = dialogText;
            }

            // quest not started
            if (!this.playerQuest) {
                let dialogText = this.currentQuest.description;
                dialogText = this.replaceKeywords(dialogText);
                dialogTextBlock.text = dialogText;

                // show quest objective
                let dialogObjective = new TextBlock("dialogObjective");
                dialogObjective.text = this.replaceKeywords(this.currentQuest.objective);
                dialogObjective.fontSize = "14px";
                dialogObjective.color = "orange";
                dialogObjective.textWrapping = TextWrapping.WordWrap;
                dialogObjective.resizeToFit = true;
                this.dialogStackPanel.addControl(dialogObjective);

                // show accept button
                const dialogBtnAccept = Button.CreateSimpleButton("dialogBtnAccept", "Accept");
                dialogBtnAccept.width = 1;
                dialogBtnAccept.height = "24px";
                dialogBtnAccept.background = "black";
                dialogBtnAccept.color = "white";
                dialogBtnAccept.thickness = 0;
                this.dialogStackPanel.addControl(dialogBtnAccept);
                dialogBtnAccept.onPointerDownObservable.add(() => {
                    // sent event to server
                    this._room.send(ServerMsg.PLAYER_QUEST_UPDATE, {
                        id: currentDialog.quest_id,
                        status: QuestStatus.ACCEPTED,
                    });
                    // go to end dialog
                    this.nextStep(lastDialogIndex);
                });

                // show decline button
                const dialogBtnDecline = Button.CreateSimpleButton("dialogBtnDecline", "Decline");
                dialogBtnDecline.width = 1;
                dialogBtnDecline.height = "24px";
                dialogBtnDecline.background = "black";
                dialogBtnDecline.color = "white";
                dialogBtnDecline.thickness = 0;
                this.dialogStackPanel.addControl(dialogBtnDecline);
                dialogBtnDecline.onPointerDownObservable.add(() => {
                    // go back to start
                    this.nextStep(0);
                });
            }
        }

        // create any quest buttons
        if (currentDialog.quests) {
            let q = 1;
            currentDialog.quests.forEach((btn: any) => {
                let quest = this._game.getGameData("quest", btn.key);
                const createBtn = Button.CreateSimpleButton("characterBtn-" + q, "! " + quest.title);
                createBtn.left = "0px;";
                createBtn.top = "0px";
                createBtn.width = 1;
                createBtn.height = "24px";
                createBtn.background = "orange";
                createBtn.color = "white";
                createBtn.thickness = 0;
                this.dialogStackPanel.addControl(createBtn);

                createBtn.onPointerDownObservable.add(() => {
                    this.nextStep(btn.goToDialog);
                });

                q++;
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

    public showRewards(rewards) {
        if (rewards.experience) {
            let dialogRewards = new TextBlock("dialogRewards-experience");
            dialogRewards.text = "Experience: " + rewards.experience;
            dialogRewards.fontSize = "14px";
            dialogRewards.color = "orange";
            dialogRewards.resizeToFit = true;
            dialogRewards.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.dialogStackPanel.addControl(dialogRewards);
        }

        if (rewards.gold) {
            let dialogRewards = new TextBlock("dialogRewards-gold");
            dialogRewards.text = "Gold: " + rewards.experience;
            dialogRewards.fontSize = "14px";
            dialogRewards.color = "orange";
            dialogRewards.resizeToFit = true;
            dialogRewards.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.dialogStackPanel.addControl(dialogRewards);
        }

        if (rewards.items && rewards.items.length > 0) {
            rewards.items.forEach((item) => {
                let dialogRewards = new TextBlock("dialogRewards-item-" + item.key);
                dialogRewards.text = "Item: " + item.key;
                dialogRewards.fontSize = "14px";
                dialogRewards.color = "orange";
                dialogRewards.resizeToFit = true;
                dialogRewards.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                this.dialogStackPanel.addControl(dialogRewards);
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
