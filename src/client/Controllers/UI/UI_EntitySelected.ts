import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import Config from "../../../shared/Config";
import { getHealthColorFromValue } from "../../../shared/Utils";

export class UI_EntitySelected {

    private _playerUI;
    private _scene;
    private _options;

    private _selectedEntityBar;
    private _entityNameTxt;
    
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
 
        ////////////////////////////////////
        //////////////////// panel
        const selectedEntityBar = new Rectangle("selectedEntityBar");
        selectedEntityBar.top = "15px;"
        selectedEntityBar.left = "-15px;"
        selectedEntityBar.width = "215px;"
        selectedEntityBar.height = "85px;";
        selectedEntityBar.background = Config.UI_CENTER_PANEL_BG;
        selectedEntityBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        selectedEntityBar.horizontalAlignment = this._options.position === 'LEFT' ? Control.HORIZONTAL_ALIGNMENT_LEFT : Control.HORIZONTAL_ALIGNMENT_RIGHT;
        selectedEntityBar.isVisible = false;
        this._playerUI.addControl(selectedEntityBar);

        ////////////////////////////////////
        //////////////////// entity name
        const entityNameTxt = new TextBlock("entityNameTxt", "");
        entityNameTxt.text = "Nothing selected";
        entityNameTxt.color = "#FFF";
        entityNameTxt.top = "5px"; 
        entityNameTxt.left = "-5px";
        entityNameTxt.fontSize = "16px;";
        entityNameTxt.textHorizontalAlignment = this._options.position === 'LEFT' ? Control.HORIZONTAL_ALIGNMENT_LEFT : Control.HORIZONTAL_ALIGNMENT_RIGHT;
        entityNameTxt.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        entityNameTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        selectedEntityBar.addControl(entityNameTxt);

        ////////////////////////////////////
        //////////////////// health bar
        const healthBar = new Rectangle("healthBar");
        healthBar.top = "25px;"
        healthBar.left = "-5px;"
        healthBar.width = "200px;"
        healthBar.height = "20px;";
        healthBar.background = Config.UI_CENTER_PANEL_BG;
        healthBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        healthBar.horizontalAlignment = this._options.position === 'LEFT' ? Control.HORIZONTAL_ALIGNMENT_LEFT : Control.HORIZONTAL_ALIGNMENT_RIGHT;
        selectedEntityBar.addControl(healthBar);
        
        const healthBarInside = new Rectangle("healthBarInside");
        healthBarInside.top = "0px;"
        healthBarInside.left = "0px;"
        healthBarInside.width = "200px;"
        healthBarInside.thickness = 0;
        healthBarInside.height = "20px;";
        healthBarInside.background = "green";
        healthBarInside.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        healthBarInside.horizontalAlignment = this._options.position === 'LEFT' ? Control.HORIZONTAL_ALIGNMENT_LEFT : Control.HORIZONTAL_ALIGNMENT_RIGHT;
        healthBar.addControl(healthBarInside);
        
        const healthBarText = new TextBlock("healthBarText", "");
        healthBarText.text = "Health: ";
        healthBarText.color = "#FFF";
        healthBarText.top = "2px"; 
        healthBarText.left = "-5px";
        healthBarText.fontSize = "16px;";
        healthBarText.textHorizontalAlignment = this._options.position === 'LEFT' ? Control.HORIZONTAL_ALIGNMENT_LEFT : Control.HORIZONTAL_ALIGNMENT_RIGHT;
        healthBarText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        healthBarText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        healthBarText.horizontalAlignment = this._options.position === 'LEFT' ? Control.HORIZONTAL_ALIGNMENT_LEFT : Control.HORIZONTAL_ALIGNMENT_RIGHT;
        healthBar.addControl(healthBarText);

        /////////////////////////////////////
        //////////////////// mana bar
        const manaBar = new Rectangle("manaBar");
        manaBar.top = "50px;"
        manaBar.left = "5px;"
        manaBar.width = "200px;"
        manaBar.height = "20px;";
        manaBar.background = Config.UI_CENTER_PANEL_BG;
        manaBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        manaBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        selectedEntityBar.addControl(manaBar);
        
        const manaBarInside = new Rectangle("manaBarInside");
        manaBarInside.top = "0px;"
        manaBarInside.left = "0px;"
        manaBarInside.width = "200px;"
        manaBarInside.thickness = 0;
        manaBarInside.height = "20px;";
        manaBarInside.background = "blue";
        manaBarInside.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        manaBarInside.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        manaBar.addControl(manaBarInside);
        
        const manaBarText = new TextBlock("manaBarText");
        manaBarText.text = "0";
        manaBarText.color = "#FFF";
        manaBarText.top = "2px"; 
        manaBarText.left = "-5px";
        manaBarText.fontSize = "16px;";
        manaBarText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        manaBarText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        manaBarText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        manaBarText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        manaBar.addControl(manaBarText);


        /////////////////////////////////////
        this._selectedEntityBar = selectedEntityBar;
        this._entityNameTxt = entityNameTxt;
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

        let entity = global.T5C.selectedEntity;
        if(this._options.currentPlayer){
            entity = this._options.currentPlayer;
        }

        if(entity){

            // show selected
            this._selectedEntityBar.isVisible = true;

            // update name
            this._entityNameTxt.text = entity.name;
            
            // health
            this._healthBar = entity.health;
            this._healthBarInside = getHealthColorFromValue(entity.health);
            this._healthBarText = (entity.health * 2)+"px";

            // mana
            this._manaBar = entity.mana;
            this._manaBarText.width = (entity.mana * 2)+"px";
        }    
    }


}