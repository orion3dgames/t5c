import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Image } from "@babylonjs/gui/2D/controls/image";
import Config from "../../../shared/Config";

export class UI_Abilities {

    private _playerUI;
    private abylity_number: number = 10;

    constructor(_playerUI) {

        this._playerUI = _playerUI;

        // create ui
        this._createUI();

        // add ui events
        this._createEvents();

    }

    _createUI(){

        // add stack panel
        const abilityPanel = new Rectangle("abilityPanel");
        abilityPanel.top = "-150px;"
        abilityPanel.width = "340px";
        abilityPanel.adaptHeightToChildren = true;
        abilityPanel.thickness = 0;
        abilityPanel.background = Config.UI_CENTER_PANEL_BG;
        abilityPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        abilityPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._playerUI.addControl(abilityPanel);

        for (let i = 1; i <= this.abylity_number; i++) {

            // calculate responsive width and height 
            let width = 340;
            let iconWidth = width / this.abylity_number;
            let leftMargin = i > 1 ?  ((i-1)*iconWidth)+"px" : "0px";
            console.log("LEFT",width, i, iconWidth, leftMargin);

            // container
            var headlineRect = new Rectangle("chatmessage_"+i);
            headlineRect.top = "3px";
            headlineRect.left = leftMargin;
            headlineRect.width = iconWidth+"px";
            headlineRect.height = iconWidth+"px";
            headlineRect.thickness = 1;
            headlineRect.paddingBottom = "5px";
            headlineRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            headlineRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            abilityPanel.addControl(headlineRect);

            if(i === 1){
                var img = new Image("image1", "./icons/ABILITY_fireball.png")
                img.stretch = Image.STRETCH_FILL;
                headlineRect.addControl(img);
            }

            if(i === 2){
                var img = new Image("image2", "./icons/ABILITY_poisonball.png")
                img.stretch = Image.STRETCH_FILL;
                headlineRect.addControl(img);
            }

            var roomTxt = new TextBlock('ability_text_'+i);
            roomTxt.paddingLeft = "5px";
            roomTxt.text = ""+i;
            roomTxt.fontSize = "12px";
            roomTxt.color = "#FFF";
            roomTxt.top = "5px";
            roomTxt.left = "0px";
            roomTxt.width = "20px";
            roomTxt.height = "15px";
            roomTxt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            roomTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            headlineRect.addControl(roomTxt);

        }

    }

    _createEvents(){

    }

}