import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Grid } from "@babylonjs/gui/2D/controls/grid";
import { dataDB } from "../../../../shared/Data/dataDB";
import { Item } from "../../../../shared/Data/ItemDB";
import { Panel } from "./Panel";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { applyTheme } from "../Theme";

export class Panel_Abilities extends Panel {
    // inventory tab
    private panel: Rectangle;

    constructor(_UI, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);

        this.createContent();

        // dynamic events
        let entity = this._currentPlayer.entity;
        if (entity) {
            entity.abilities.onAdd((item, sessionId) => {
                this.refresh();
            });
            entity.abilities.onRemove((item, sessionId) => {
                this.refresh();
            });
            entity.abilities.onChange((item, sessionId) => {
                this.refresh();
            });
        }
    }

    // open panel
    public open() {
        super.open();
        this.refresh();
    }

    // create panel
    private createContent() {
        let panel: Rectangle = this._panelContent;

        // if already exists
        panel.children.forEach((el) => {
            el.dispose();
        });

        // panel title
        const skillsPanelStack = new StackPanel("skillsPanelStack");
        skillsPanelStack.width = 1;
        skillsPanelStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        skillsPanelStack.setPaddingInPixels(5, 5, 5, 5);
        panel.addControl(skillsPanelStack);

        let Abilities = dataDB.load("abilities");
        for (let key in Abilities) {
            // get ability details
            let ability = Abilities[key];

            let skillsPanel = new Rectangle("abilityCont" + ability.key);
            skillsPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            skillsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            skillsPanel.top = "5px";
            skillsPanel.left = 0;
            skillsPanel.width = 1;
            skillsPanel.height = "50px";
            skillsPanel.background = "#CCC";
            skillsPanel.thickness = 1;
            skillsPanel = applyTheme(skillsPanel);
            skillsPanelStack.addControl(skillsPanel);

            const tooltipName = new TextBlock("abilityName" + ability.key);
            tooltipName.color = "#FFF";
            tooltipName.top = "0px";
            tooltipName.left = "0px";
            tooltipName.fontSize = "24px;";
            tooltipName.resizeToFit = true;
            tooltipName.text = ability.label;
            tooltipName.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            tooltipName.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            tooltipName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            tooltipName.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            skillsPanel.addControl(tooltipName);

            let entity = this._currentPlayer.entity;
            if (entity.abilities[ability.key]) {
                const abilityLearn = Button.CreateSimpleButton("abilityForget" + ability.key, "Forget Ability");
                abilityLearn.top = "0px;";
                abilityLearn.left = "15px;";
                abilityLearn.width = "190px;";
                abilityLearn.height = "30px";
                abilityLearn.color = "white";
                abilityLearn.background = "#000";
                abilityLearn.thickness = 1;
                abilityLearn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                abilityLearn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
                skillsPanel.addControl(abilityLearn);
                abilityLearn.onPointerDownObservable.add(() => {
                    this._gameRoom.send("learn_skill", ability.key);
                });
            } else {
                const abilityLearn = Button.CreateSimpleButton("abilityLearn" + ability.key, "Learn Ability");
                abilityLearn.top = "0px;";
                abilityLearn.left = "15px;";
                abilityLearn.width = "190px;";
                abilityLearn.height = "30px";
                abilityLearn.color = "white";
                abilityLearn.background = "#000";
                abilityLearn.thickness = 1;
                abilityLearn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                abilityLearn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
                skillsPanel.addControl(abilityLearn);
                abilityLearn.onPointerDownObservable.add(() => {
                    this._gameRoom.send("learn_skill", ability.key);
                });
            }
        }
    }

    ///////////////////////////////////////
    ///////////////////////////////////////
    // INVENTORY PANEL
    public refresh() {
        this.createContent();
    }
}
