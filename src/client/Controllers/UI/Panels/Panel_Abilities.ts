import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Panel } from "./Panel";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { applyTheme } from "../Theme";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";
import { ServerMsg } from "../../../../shared/types";

export class Panel_Abilities extends Panel {
    // inventory tab
    private panel: Rectangle;

    constructor(_UI, _currentPlayer, options) {
        super(_UI, _currentPlayer, options);

        this.createContent();

        // dynamic events
        let entity = this._currentPlayer.entity;
        entity.player_data.abilities.onAdd((item, sessionId) => {
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

    // create panel
    private createContent() {
        let panel: Rectangle = this._panelContent;

        // if already exists
        panel.children.forEach((el) => {
            el.dispose();
        });

        // add scrollable container
        const scrollViewer = new ScrollViewer("scrollViewer");
        scrollViewer.width = 0.99;
        scrollViewer.height = 0.92;
        scrollViewer.top = 0;
        scrollViewer.thickness = 0;
        scrollViewer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        scrollViewer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        panel.addControl(scrollViewer);

        // panel title
        const skillsPanelStack = new StackPanel("skillsPanelStack");
        skillsPanelStack.width = 1;
        skillsPanelStack.adaptHeightToChildren = true;
        skillsPanelStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        skillsPanelStack.setPaddingInPixels(5, 5, 5, 5);
        scrollViewer.addControl(skillsPanelStack);

        this.addAbilities(skillsPanelStack);
        //this.addAbilities(skillsPanelStack);
    }

    addAbilities(skillsPanelStack) {
        let Abilities = this._game.loadGameData("abilities");
        for (let key in Abilities) {
            // get ability details
            let ability = Abilities[key];

            let skillsPanel = new Rectangle("abilityCont" + ability.key);
            skillsPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            skillsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            skillsPanel.top = "0px";
            skillsPanel.left = "0px;";
            skillsPanel.width = 1;
            skillsPanel.height = "50px";
            skillsPanel.background = "#CCC";
            skillsPanel.thickness = 1;
            skillsPanel.paddingLeft = "5px;";
            skillsPanel.paddingBottom = "5px;";
            applyTheme(skillsPanel);
            skillsPanelStack.addControl(skillsPanel);

            // add icon
            let imageBLoc = new Rectangle("imageBLoc" + ability.key);
            imageBLoc.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            imageBLoc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            imageBLoc.top = "0px";
            imageBLoc.left = "0px;";
            imageBLoc.width = "40px;";
            imageBLoc.height = "40px;";
            imageBLoc.thickness = 0;
            skillsPanel.addControl(imageBLoc);
            var imageData = this._loadedAssets[ability.icon];
            var img = new Image("itemImage_" + ability.key, imageData);
            img.stretch = Image.STRETCH_FILL;
            imageBLoc.addControl(img);

            // on hover tooltip
            imageBLoc.onPointerEnterObservable.add(() => {
                this._UI._Tooltip.refresh("ability", ability, imageBLoc, "right", "center");
            });
            // on hover tooltip
            imageBLoc.onPointerOutObservable.add(() => {
                this._UI._Tooltip.close();
            });

            const tooltipName = new TextBlock("abilityName" + ability.key);
            tooltipName.color = "#FFF";
            tooltipName.top = "5px";
            tooltipName.left = "50px";
            tooltipName.fontSize = "18px;";
            tooltipName.resizeToFit = true;
            tooltipName.text = ability.title;
            tooltipName.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            tooltipName.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            tooltipName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            tooltipName.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            skillsPanel.addControl(tooltipName);

            const abilityDescr = new TextBlock("abilityDescr" + ability.key);
            abilityDescr.color = "rgba(255,255,255,.6)";
            abilityDescr.top = "0px";
            abilityDescr.left = "50px";
            abilityDescr.fontSize = "12px;";
            abilityDescr.resizeToFit = true;
            abilityDescr.text = ability.description;
            abilityDescr.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            abilityDescr.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            abilityDescr.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            abilityDescr.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            skillsPanel.addControl(abilityDescr);
        }
    }

    public objToString(obj) {
        let str = "Required ";
        for (const [p, val] of Object.entries(obj)) {
            str += `| ${p}:${val} `;
        }
        return str;
    }

    ///////////////////////////////////////
    ///////////////////////////////////////
    // INVENTORY PANEL
    public refresh() {
        this.createContent();
    }
}
