import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import Config from "../../../shared/Config";
import { getHealthColorFromValue, roundTo } from "../../../shared/Utils";
import { Leveling } from "../../../shared/Entities/Player/Leveling";

export class UI_EntitySelected {

    private _playerUI;
    private _scene;
    private _options;

    private _selectedEntityBar;
    private _entityNameTxt;
    private _entityLevelTxt;
    
    private _healthBar;
    private _healthBarInside;
    private _healthBarText;

    private _manaBar;
    private _manaBarInside;
    private _manaBarText;

    constructor(_playerUI, _scene, options = { position: 'LEFT', currentPlayer: false }) {

        this._playerUI = _playerUI;
        this._scene = _scene;
        this._options = options;

        this._createUI();

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {

            // refresh
            this._update();
        });

    }

    _createUI(){

        //let alignHoriz = this._options.position === 'LEFT' ? Control.HORIZONTAL_ALIGNMENT_LEFT : Control.HORIZONTAL_ALIGNMENT_RIGHT;
        let alignHoriz = Control.HORIZONTAL_ALIGNMENT_LEFT;
        let marginLeft = this._options.position === 'LEFT' ? "15px":"-15px;";
        let marginLeft2 = "5px";
        let barWidth = 200;
        let barHeight = 21;
 
        ////////////////////////////////////
        //////////////////// panel
        const selectedEntityBar = new Rectangle("selectedEntityBar");
        selectedEntityBar.top = "15px;"
        selectedEntityBar.left = marginLeft;
        selectedEntityBar.width = "210px;"
        selectedEntityBar.height = "78px;";
        selectedEntityBar.background = Config.UI_CENTER_PANEL_BG;
        selectedEntityBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        selectedEntityBar.horizontalAlignment = this._options.position === 'LEFT' ? Control.HORIZONTAL_ALIGNMENT_LEFT : Control.HORIZONTAL_ALIGNMENT_RIGHT;
        selectedEntityBar.isVisible = false;
        this._playerUI.addControl(selectedEntityBar);

        ////////////////////////////////////
        //////////////////// entity name
        const entityNameTxt = new TextBlock("entityNameTxt", "");
        entityNameTxt.text = "XXXXXX";
        entityNameTxt.color = "#FFF";
        entityNameTxt.top = "5px"; 
        entityNameTxt.left = marginLeft2; 
        entityNameTxt.fontSize = "16px;";
        entityNameTxt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        entityNameTxt.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        entityNameTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        selectedEntityBar.addControl(entityNameTxt);

        const entityLevelTxt = new TextBlock("entityLevelTxt", "");
        entityLevelTxt.text = "XXXXX";
        entityLevelTxt.color = "#FFF";
        entityLevelTxt.top = "3px"; 
        entityLevelTxt.left = "-5px"; 
        entityLevelTxt.fontSize = "10px;";
        entityLevelTxt.lineSpacing = "-2px;";
        entityLevelTxt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        entityLevelTxt.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        entityLevelTxt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        entityLevelTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        selectedEntityBar.addControl(entityLevelTxt);

        ////////////////////////////////////
        //////////////////// health bar
        const healthBar = new Rectangle("healthBar");
        healthBar.top = "25px;"
        healthBar.left = marginLeft2; 
        healthBar.width = barWidth+"px;"
        healthBar.height = barHeight+"px";
        healthBar.background = Config.UI_CENTER_PANEL_BG;
        healthBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        healthBar.horizontalAlignment = alignHoriz;
        selectedEntityBar.addControl(healthBar);
        
        const healthBarInside = new Rectangle("healthBarInside");
        healthBarInside.top = "0px;"
        healthBarInside.left = "0px;"
        healthBarInside.width = (barWidth-2)+"px;"
        healthBarInside.thickness = 0;
        healthBarInside.height = (barHeight-1)+"px";
        healthBarInside.background = "green";
        healthBarInside.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        healthBarInside.horizontalAlignment = alignHoriz;
        healthBar.addControl(healthBarInside);
        
        const healthBarText = new TextBlock("healthBarText", "");
        healthBarText.text = "0";
        healthBarText.color = "#FFF";
        healthBarText.top = "2px"; 
        healthBarText.left = "5px"; 
        healthBarText.fontSize = "16px;";
        healthBarText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        healthBarText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        healthBarText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        healthBarText.horizontalAlignment = alignHoriz;
        healthBarInside.addControl(healthBarText);

        /////////////////////////////////////
        //////////////////// mana bar
        const manaBar = new Rectangle("manaBar");
        manaBar.top = "50px;"
        manaBar.left = "5px"; 
        manaBar.width = barWidth+"px;"
        manaBar.height = barHeight+"px";
        manaBar.background = Config.UI_CENTER_PANEL_BG;
        manaBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        manaBar.horizontalAlignment = alignHoriz;
        selectedEntityBar.addControl(manaBar);
        
        const manaBarInside = new Rectangle("manaBarInside");
        manaBarInside.top = "0px;"
        manaBarInside.left = "0px;"
        manaBarInside.width = (barWidth-2)+"px;"
        manaBarInside.thickness = 0;
        manaBarInside.height = (barHeight-1)+"px";
        manaBarInside.background = "blue";
        manaBarInside.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        manaBarInside.horizontalAlignment = alignHoriz;
        manaBar.addControl(manaBarInside);
        
        const manaBarText = new TextBlock("manaBarText");
        manaBarText.text = "0";
        manaBarText.color = "#FFF";
        manaBarText.top = "2px"; 
        manaBarText.left = "5px"; 
        manaBarText.fontSize = "16px;";
        manaBarText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        manaBarText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        manaBarText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        manaBarText.horizontalAlignment = alignHoriz;
        manaBarInside.addControl(manaBarText);


        /////////////////////////////////////
        this._selectedEntityBar = selectedEntityBar;
        this._entityNameTxt = entityNameTxt;
        this._entityLevelTxt = entityLevelTxt;
        this._healthBar = healthBar;
        this._healthBarInside = healthBarInside;
        this._healthBarText = healthBarText;
        this._manaBar = manaBar;
        this._manaBarInside = manaBarInside;
        this._manaBarText = manaBarText;

    }

    // refresh panel
    private _update(){

        this._selectedEntityBar.isVisible = false;

        let entity = global.T5C.selectedEntity ? global.T5C.selectedEntity : false;
        if(this._options.currentPlayer !== false){
            entity = this._options.currentPlayer;
        }

        if(entity){

            // show selected
            this._selectedEntityBar.isVisible = true;

            // update name
            this._entityNameTxt.text = entity.name;

            let level = entity.level;
            let progress = Leveling.getLevelProgress(entity.experience);
            if(this._options.currentPlayer){
                this._entityLevelTxt.text = "Lvl:"+level+" Exp:"+entity.experience+" \n Progress:"+progress+"%";
            }else{
                this._entityLevelTxt.text = "Lvl: "+level;
            }
            
            // health
            let health = roundTo(entity.health, 0);
            let healthWidth = (entity.health * 100 / entity.raceData.maxHealth) * 2;
            this._healthBarInside.width = healthWidth+"px";
            //this._healthBarInside.background = getHealthColorFromValue(entity.health);
            this._healthBarText.text = health;

            // mana
            let mana = roundTo(entity.mana, 0);
            let manaWidth = (entity.mana * 100 / entity.raceData.maxMana) * 2;
            this._manaBarInside.width = manaWidth+"px";
            this._manaBarText.text = mana;
        }    
    }


}