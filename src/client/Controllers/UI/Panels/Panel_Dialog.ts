import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Panel } from "./Panel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { UserInterface } from "../../UserInterface";
import { QuestObjective, QuestStatus, ServerMsg } from "../../../../shared/types";
import { QuestSchema } from "../../../../server/rooms/schema";

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
        this.dialogStackPanel.getDescendants().forEach((el) => {
            el.dispose();
        });
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
            if (this.currentQuest.type === QuestObjective.KILL_AMOUNT && this.playerQuest.qty === this.currentQuest.quantity && this.playerQuest.status === 0) {
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
        this.playerQuest = this._currentPlayer.player_data.quests[currentDialog.quest_id];
        this.currentQuest = this._game.getGameData("quest", currentDialog.quest_id);
        let questCompleted = this.isQuestReadyToComplete();

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

        if (currentDialog.type === "text") {
            let dialogText = currentDialog.text;
            dialogText = this.replaceKeywords(dialogText);
            dialogTextBlock.text = dialogText;
        }

        // if dialog is quest, show accept and decline buttons
        if (currentDialog.type === "quest") {
            // accepted
            if (this.playerQuest && this.playerQuest.status === 0) {
                let dialogText = this.currentQuest.descriptionOngoing;
                dialogText = this.replaceKeywords(dialogText);
                dialogTextBlock.text = dialogText;
                currentDialog.isEndOfDialog = true;
            }

            // ready to complete
            if (questCompleted) {
                let dialogText = this.currentQuest.descriptionReward;
                dialogText = this.replaceKeywords(dialogText);
                dialogTextBlock.text = dialogText;
                currentDialog.isEndOfDialog = false;

                // show rewards
                let rewardText = "Experience: " + this.currentQuest.reward.experience ?? 0 + "\n\n ";
                rewardText += "Gold: " + this.currentQuest.reward.gold ?? 0 + "\n\n";

                let dialogObjective = new TextBlock("dialogObjective");
                dialogObjective.text = rewardText;
                dialogObjective.fontSize = "14px";
                dialogObjective.color = "orange";
                dialogObjective.textWrapping = TextWrapping.WordWrap;
                dialogObjective.resizeToFit = true;
                dialogObjective.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                dialogObjective.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                this.dialogStackPanel.addControl(dialogObjective);

                // complete button
                const createBtn = Button.CreateSimpleButton("characterBtn", "Complete Quest");
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
                    this._room.send(ServerMsg.PLAYER_QUEST_UPDATE, {
                        id: currentDialog.quest_id,
                        status: QuestStatus.READY_TO_COMPLETE,
                    });
                    this.close();
                });
            }

            // completed
            if (this.playerQuest && this.playerQuest.status === 1) {
                let dialogText = this.currentQuest.descriptionCompleted;
                dialogText = this.replaceKeywords(dialogText);
                dialogTextBlock.text = dialogText;
            }

            // not started
            if (!this.playerQuest) {
                let dialogText = this.currentQuest.description;
                dialogText = this.replaceKeywords(dialogText);
                dialogTextBlock.text = dialogText;

                let dialogObjective = new TextBlock("dialogObjective");
                dialogObjective.text = this.replaceKeywords(this.currentQuest.objective);
                dialogObjective.fontSize = "14px";
                dialogObjective.color = "orange";
                dialogObjective.textWrapping = TextWrapping.WordWrap;
                dialogObjective.resizeToFit = true;
                dialogObjective.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                dialogObjective.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                this.dialogStackPanel.addControl(dialogObjective);

                const dialogBtnAccept = Button.CreateSimpleButton("dialogBtnAccept", "Accept");
                dialogBtnAccept.width = 1;
                dialogBtnAccept.height = "24px";
                dialogBtnAccept.background = "black";
                dialogBtnAccept.color = "white";
                dialogBtnAccept.thickness = 0;
                this.dialogStackPanel.addControl(dialogBtnAccept);
                dialogBtnAccept.onPointerDownObservable.add(() => {
                    this._room.send(ServerMsg.PLAYER_QUEST_UPDATE, {
                        id: currentDialog.quest_id,
                        status: QuestStatus.ACCEPTED,
                    });
                    this.nextStep(currentDialog.quest.accepted);
                });

                const dialogBtnDecline = Button.CreateSimpleButton("dialogBtnDecline", "Decline");
                dialogBtnDecline.width = 1;
                dialogBtnDecline.height = "24px";
                dialogBtnDecline.background = "black";
                dialogBtnDecline.color = "white";
                dialogBtnDecline.thickness = 0;
                this.dialogStackPanel.addControl(dialogBtnDecline);
                dialogBtnDecline.onPointerDownObservable.add(() => {
                    this.nextStep(currentDialog.quest.declined);
                });
            }
        }

        // create buttons
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
                createBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                createBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                this.dialogStackPanel.addControl(createBtn);

                createBtn.onPointerDownObservable.add(() => {
                    this.nextStep(btn.goToDialog);
                });

                q++;
            });
        }

        // create buttons
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
                createBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                createBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
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
