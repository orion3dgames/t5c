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

export class TrainerDialog {
    private panel: Panel_Dialog;
    private currentDialog;
    private panelDetails;
    private stackPanel: StackPanel;
    private selected;

    private backgroundColor = "#292929";
    private backgroundSelected = "green";

    constructor(panel: Panel_Dialog, trainer) {
        this.panel = panel;
        this.currentDialog = trainer;
        this.refresh();
    }

    refresh() {
        this.panel._panelContent.getDescendants().forEach((el) => {
            el.dispose();
        });

        // only show spells that not already learnt
        let abilities = this.currentDialog.abilities ?? [];
        let abilityAvailableToLearn: any[] = [];
        abilities.forEach((ability) => {
            if (!this.playerHasAbility(ability)) {
                abilityAvailableToLearn.push(ability);
            }
        });
        console.log("AVAILABLE TO LEARN", abilityAvailableToLearn);

        // create ui
        this.create(abilityAvailableToLearn);
    }

    canLearn(ability: Ability): boolean {
        let playerData = this.panel._currentPlayer.player_data;
        let canLearn = true;
        if (ability.required_strength && ability.required_strength > playerData.strength) {
            canLearn = false;
        }
        if (ability.required_endurance && ability.required_endurance > playerData.endurance) {
            canLearn = false;
        }
        if (ability.required_agility && ability.required_agility > playerData.agility) {
            canLearn = false;
        }
        if (ability.required_intelligence && ability.required_intelligence > playerData.intelligence) {
            canLearn = false;
        }
        if (ability.required_wisdom && ability.required_wisdom > playerData.wisdom) {
            canLearn = false;
        }
        if (ability.required_level && ability.required_level > this.panel._currentPlayer.level) {
            canLearn = false;
        }
        if (ability.value && ability.value > playerData.gold) {
            canLearn = false;
        }
        return canLearn;
    }

    canLearnColor(ability) {
        return this.canLearn(ability) ? "green" : "red";
    }

    playerHasAbility(ability) {
        return this.panel._currentPlayer.player_data.abilities[ability.key] ? true : false;
    }

    create(abilities) {
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
        scrollViewer.height = 0.54;
        scrollViewer.top = "24px;";
        scrollViewer.thickness = 0;
        scrollViewer.background = this.backgroundColor;
        scrollViewer.setPaddingInPixels(5, 5, 5, 5);
        scrollViewer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        scrollViewer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.panel._panelContent.addControl(scrollViewer);

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

        if (abilities.length > 0) {
            abilities.forEach((a) => {
                let ability = this.panel._game.getGameData("ability", a.key);

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
                    ability: ability,
                };
                stackPanel.addControl(blocContainer);

                var blockTitle = new TextBlock("blockTitle");
                blockTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                blockTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                blockTitle.paddingLeft = "5px";
                blockTitle.text = ability.title + " (Level " + ability.required_level + ")";
                blockTitle.fontSize = "14px";
                blockTitle.color = this.canLearnColor(ability);
                blockTitle.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                blockTitle.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                blocContainer.addControl(blockTitle);

                // on hover tooltip
                blocContainer.onPointerClickObservable.add(() => {
                    this.select(blocContainer, blockTitle);
                    this.createDetails(ability);
                });
            });

            // add details scrollable container
            const scrollViewerDetails = new ScrollViewer("scrollViewerDetails");
            scrollViewerDetails.width = 1;
            scrollViewerDetails.height = 0.4;
            scrollViewerDetails.top = -0.1;
            scrollViewerDetails.thickness = 0;
            scrollViewerDetails.setPaddingInPixels(5, 5, 5, 5);
            scrollViewerDetails.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            scrollViewerDetails.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.panel._panelContent.addControl(scrollViewerDetails);
            this.panelDetails = scrollViewerDetails;

            // select first available ability
            let firstElement = this.stackPanel.children[0] as Rectangle;
            let ability = this.panel._game.getGameData("ability", abilities[0].key);
            this.select(this.stackPanel.children[0], firstElement.children[0]);
            this.createDetails(ability);
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
            el.children[0].color = this.canLearnColor(el.metadata.ability);
        });

        // color selected line
        blocContainer.background = this.canLearnColor(blocContainer.metadata.ability);
        blockTitle.color = "white";
    }

    createDetails(ability) {
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

        let titleBloc = new Rectangle("titleBloc" + ability.key);
        titleBloc.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        titleBloc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        titleBloc.top = "5px";
        titleBloc.left = "0px;";
        titleBloc.width = 1;
        titleBloc.height = "35px;";
        titleBloc.thickness = 0;
        stackPanel.addControl(titleBloc);

        if (this.canLearn(ability)) {
            const createBtn = Button.CreateSimpleButton("learnBTN", "Train");
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

            let observable = createBtn.onPointerClickObservable.add(() => {
                this.panel._game.sendMessage(ServerMsg.PLAYER_LEARN_SKILL, {
                    key: ability.key,
                });
                if (createBtn.textBlock) {
                    createBtn.textBlock.text = "...";
                }
                if (observable) {
                    observable.remove();
                }
                // todo: we need some sort of callback here
                setTimeout(() => {
                    this.refresh();
                }, 500);
            });
        } else {
            const createBtn = Button.CreateSimpleButton("learnBTN", "Train");
            createBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            createBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            createBtn.left = "-5px;";
            createBtn.top = "5px";
            createBtn.width = "50px;";
            createBtn.height = "20px";
            createBtn.background = "gray";
            createBtn.color = "white";
            createBtn.thickness = 0;
            titleBloc.addControl(createBtn);
        }

        // add icon + title
        let imageBLoc = new Rectangle("imageBLoc" + ability.key);
        imageBLoc.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        imageBLoc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        imageBLoc.top = "0px";
        imageBLoc.left = "0px;";
        imageBLoc.width = "30px;";
        imageBLoc.height = "30px;";
        imageBLoc.thickness = 0;
        titleBloc.addControl(imageBLoc);

        var imageData = this.panel._loadedAssets[ability.icon];
        var img = new Image("itemImage_" + ability.key, imageData);
        img.stretch = Image.STRETCH_FILL;
        imageBLoc.addControl(img);

        // add title
        const tooltipName = new TextBlock("abilityName" + ability.key);
        tooltipName.color = "#FFF";
        tooltipName.top = "5px";
        tooltipName.left = "40px";
        tooltipName.fontSize = "18px;";
        tooltipName.resizeToFit = true;
        tooltipName.text = ability.title;
        tooltipName.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tooltipName.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        tooltipName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tooltipName.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        titleBloc.addControl(tooltipName);

        // addd description
        const abilityDescr = new TextBlock("abilityDescr" + ability.key);
        abilityDescr.color = "rgba(255,255,255,.6)";
        abilityDescr.top = 0;
        abilityDescr.left = "0px";
        abilityDescr.fontSize = "12px;";
        abilityDescr.textWrapping = TextWrapping.WordWrap;
        abilityDescr.resizeToFit = true;
        abilityDescr.text = ability.description;
        abilityDescr.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        abilityDescr.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        abilityDescr.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        abilityDescr.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        stackPanel.addControl(abilityDescr);

        // add requirements
        let requirements = "";
        if (ability.value) {
            requirements += "Cost: " + ability.value + "\n";
        }
        if (ability.required_level) {
            requirements += "Level Required: " + ability.required_level + "\n";
        }
        if (ability.required_strength) {
            requirements += "Strength Required: " + ability.required_strength + "\n";
        }
        if (ability.required_endurance) {
            requirements += "Endurance Required: " + ability.required_endurance + "\n";
        }
        if (ability.required_agility) {
            requirements += "Agility Required: " + ability.required_agility + "\n";
        }
        if (ability.required_intelligence) {
            requirements += "Intelligence Required: " + ability.required_intelligence + "\n";
        }
        if (ability.required_wisdom) {
            requirements += "Wisdom Required: " + ability.required_wisdom + "\n";
        }

        const requiredBloc = new TextBlock("requiredBloc" + ability.key);
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
