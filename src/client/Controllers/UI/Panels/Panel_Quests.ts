import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Panel } from "./Panel";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { QuestObjectives } from "../../../../shared/types";
import { QuestsHelper } from "../../../../shared/Class/QuestsHelper";

export class Panel_Quests extends Panel {
    private panel: Rectangle;

    constructor(_UI, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);

        // create content
        this.createContent();

        // dynamic events
        let entity = this._currentPlayer.entity;
        entity.player_data.quests.onAdd((item, sessionId) => {
            this.refresh();
            // todo: could be a performance issue here?
            // orion to keep an eye on this one
            item.onChange((item, sessionId) => {
                this.refresh();
            });
            item.onRemove((item, sessionId) => {
                this.refresh();
            });
        });
    }

    // open panel
    public open() {
        super.open();
        this.refresh();
    }

    public refresh() {
        this.createContent();
    }

    public replaceKeywords(text, quest, pQuest, location) {
        text = text.replace("@KillRequired", quest.quantity);
        text = text.replace("@TargetName", QuestsHelper.findQuestTargetName(location, quest.spawn_key, quest.quantity));
        text = text.replace("@KillCompleted", pQuest.qty);
        return text;
    }

    // create panel
    private createContent() {
        // if already exists
        this._panelContent.children.forEach((el) => {
            el.dispose();
        });

        // add scrollable container
        const scrollViewer = new ScrollViewer("scrollViewer");
        scrollViewer.width = 0.99;
        scrollViewer.height = 1;
        scrollViewer.top = 0;
        scrollViewer.thickness = 0;
        scrollViewer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        scrollViewer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._panelContent.addControl(scrollViewer);

        // add stack panel
        const stackPanel = new StackPanel("stackPanel");
        stackPanel.width = 1;
        stackPanel.height = 1;
        stackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        stackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        stackPanel.paddingTop = "5px;";
        stackPanel.spacing = 5;
        scrollViewer.addControl(stackPanel);

        // add quests
        let quests = this._currentPlayer.entity.player_data.quests ?? [];

        if (quests.size > 0) {
            quests.forEach((q) => {
                let quest = this._game.getGameData("quest", q.key);
                let location = this._game.getGameData("location", quest.location);

                let short_objective = QuestObjectives[quest.type];
                short_objective = this.replaceKeywords(short_objective, quest, q, location);

                let questPanel = new Rectangle("questPanel");
                questPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                questPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                questPanel.top = "0px";
                questPanel.left = "0px;";
                questPanel.width = 1;
                questPanel.height = "40px";
                questPanel.thickness = 1;
                questPanel.setPadding(0);
                questPanel.background = "black";
                questPanel.color = "gray";
                stackPanel.addControl(questPanel);

                var questTitle = new TextBlock("questTitle");
                questTitle.top = "4px";
                questTitle.paddingLeft = "5px";
                questTitle.text = quest.title;
                questTitle.textHorizontalAlignment = 0;
                questTitle.fontSize = "14px";
                questTitle.color = "white";
                questTitle.fontWeight = "bold";
                questTitle.textWrapping = TextWrapping.WordWrap;
                questTitle.resizeToFit = true;
                questTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                questTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                questPanel.addControl(questTitle);

                var questObjective = new TextBlock("questObjective");
                questObjective.top = "20px";
                questObjective.paddingLeft = "5px";
                questObjective.text = short_objective;
                questObjective.textHorizontalAlignment = 0;
                questObjective.fontSize = "12px";
                questObjective.color = "orange";
                questObjective.textWrapping = TextWrapping.WordWrap;
                questObjective.resizeToFit = true;
                questObjective.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                questObjective.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                questPanel.addControl(questObjective);
            });
        } else {
            var noQuests = new TextBlock("noQuests");
            noQuests.text = "You have no quests. Explore the world & talk to people to discover new quests.";
            noQuests.fontSize = "14px";
            noQuests.color = "white";
            noQuests.textWrapping = TextWrapping.WordWrap;
            noQuests.resizeToFit = true;
            noQuests.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            noQuests.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            noQuests.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            stackPanel.addControl(noQuests);
        }
    }
}
