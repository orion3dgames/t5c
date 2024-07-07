import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { generatePanel, getPadding } from "./Theme";
import { roundTo } from "../../../shared/Utils/index";
import { GameController } from "../GameController";
import { UserInterface } from "../UserInterface";

export class EntitySelectedBar {
    private _playerUI;
    private LABELS_ADT;
    private _scene;
    private _game: GameController;
    private _loadedAssets;
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

    private _label;

    constructor(_UI: UserInterface, options = { panelName: "", currentPlayer: false }) {
        this._playerUI = _UI._playerUI;
        this.LABELS_ADT = _UI.LABELS_ADT;
        this._scene = _UI._scene;
        this._game = _UI._game;
        this._options = options;
        this._loadedAssets = _UI._loadedAssets;

        this._createUI();
    }

    _createUI() {
        let alignHoriz = Control.HORIZONTAL_ALIGNMENT_LEFT;
        let panelWidth = 250;
        let barWidth = 188;

        let leftMargin = 15;
        let topMargin = 15;
        if (this._options.panelName === "target") {
            leftMargin = 30;
            topMargin = 85;
        }
        ////////////////////////////////////
        //////////////////// panel
        const selectedEntityBar = generatePanel("selected" + this._options.panelName, panelWidth + "px;", "62px", topMargin + "px", leftMargin + "px");
        selectedEntityBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        selectedEntityBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._playerUI.addControl(selectedEntityBar);

        const paddingPanel = new Rectangle("paddingPanel");
        paddingPanel.width = 1;
        paddingPanel.height = 1;
        paddingPanel.thickness = 0;
        paddingPanel.setPaddingInPixels(getPadding());
        selectedEntityBar.addControl(paddingPanel);

        const imgPanel = new Rectangle("imgPanel");
        imgPanel.width = "45px";
        imgPanel.height = "45px;";
        imgPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        imgPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        imgPanel.background = "black";
        imgPanel.thickness = 0;
        paddingPanel.addControl(imgPanel);

        if (this._options.currentPlayer !== false) {
            let entity = this._options.currentPlayer;
            var imageData = this._loadedAssets[entity.icon];
            var img = new Image("itemImage_" + entity.key, imageData);
            img.stretch = Image.STRETCH_FILL;
            imgPanel.addControl(img);
        }

        ////////////////////////////////////
        //////////////////// health bar

        const healthBar = new Rectangle("healthBar");
        healthBar.top = "0px;";
        healthBar.left = "50px";
        healthBar.width = barWidth + "px;";
        healthBar.height = "25px";
        healthBar.thickness = 0;
        healthBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        healthBar.horizontalAlignment = alignHoriz;
        paddingPanel.addControl(healthBar);

        const healthBarInside = new Rectangle("healthBarInside");
        healthBarInside.top = "0px;";
        healthBarInside.left = "0px;";
        healthBarInside.width = 1;
        healthBarInside.thickness = 0;
        healthBarInside.height = 1;
        healthBarInside.background = "#75ed1b";
        healthBarInside.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        healthBarInside.horizontalAlignment = alignHoriz;
        healthBar.addControl(healthBarInside);

        const healthBarText = new TextBlock("healthBarText", "");
        healthBarText.text = "0";
        healthBarText.color = "#FFF";
        healthBarText.top = "0px";
        healthBarText.left = "-5px";
        healthBarText.fontSize = "14px;";
        healthBarText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        healthBarText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        healthBarText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        healthBarText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        healthBar.addControl(healthBarText);

        /////////////////////////////////////
        //////////////////// mana bar
        const manaBar = new Rectangle("manaBar");
        manaBar.top = "28px;";
        manaBar.left = "50px";
        manaBar.width = barWidth + "px;";
        manaBar.height = "17px";
        manaBar.thickness = 0;
        manaBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        manaBar.horizontalAlignment = alignHoriz;
        paddingPanel.addControl(manaBar);

        const manaBarInside = new Rectangle("manaBarInside");
        manaBarInside.top = "0px;";
        manaBarInside.left = "0px;";
        manaBarInside.width = 1;
        manaBarInside.thickness = 0;
        manaBarInside.height = 1;
        manaBarInside.background = "blue";
        manaBarInside.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        manaBarInside.horizontalAlignment = alignHoriz;
        manaBar.addControl(manaBarInside);

        const manaBarText = new TextBlock("manaBarText");
        manaBarText.text = "0";
        manaBarText.color = "#FFF";
        manaBarText.top = "1px";
        manaBarText.left = "-5px";
        manaBarText.fontSize = "12px;";
        manaBarText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        manaBarText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        manaBarText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        manaBarText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        manaBar.addControl(manaBarText);

        ///////////////////////////////////////////////////

        ////////////////////////////////////
        //////////////////// entity name
        const entityNameTxt = new TextBlock("entityNameTxt", "");
        entityNameTxt.text = "XXXXXX";
        entityNameTxt.color = "#FFF";
        entityNameTxt.top = "0px";
        entityNameTxt.left = "5px";
        entityNameTxt.fontSize = "14px;";
        entityNameTxt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        entityNameTxt.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        entityNameTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        healthBar.addControl(entityNameTxt);

        const entityLevelTxt = new TextBlock("entityLevelTxt", "");
        entityLevelTxt.text = "XXXXX";
        entityLevelTxt.color = "#FFF";
        entityLevelTxt.top = "0px";
        entityLevelTxt.left = "5px";
        entityLevelTxt.fontSize = "12px;";
        entityLevelTxt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        entityLevelTxt.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        entityLevelTxt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        entityLevelTxt.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        manaBar.addControl(entityLevelTxt);

        /////////////////////////////////////
        this._entityNameTxt = entityNameTxt;
        this._entityLevelTxt = entityLevelTxt;
        this._selectedEntityBar = selectedEntityBar;

        this._healthBar = healthBar;
        this._healthBarInside = healthBarInside;
        this._healthBarText = healthBarText;

        this._manaBar = manaBar;
        this._manaBarInside = manaBarInside;
        this._manaBarText = manaBarText;

        // hide it by default
        this._selectedEntityBar.isVisible = false;
    }

    public setTarget(target) {
        // show selected
        this._selectedEntityBar.isVisible = true;

        // set as selected
        this._game.selectedEntity = target;

        // update data
        this._entityNameTxt.text = target.name;
        this._entityLevelTxt.text = "Lvl " + target.level;

        //
        this.setData(target);
    }

    setData(entity) {
        // health
        let health = roundTo(entity.health, 0);
        let healthWidth = entity.health / entity.maxHealth;
        this._healthBarInside.width = healthWidth;
        this._healthBarText.text = health + "/" + entity.maxHealth;

        // mana
        let mana = roundTo(entity.mana, 0);
        let manaWidth = entity.mana / entity.maxMana;
        this._manaBarInside.width = manaWidth;
        this._manaBarText.text = mana + "/" + entity.maxMana;

        // update data
        this._entityNameTxt.text = entity.name;
        this._entityLevelTxt.text = "Lvl " + entity.level;
    }

    // refresh panel
    public update() {
        let entity = this._game.selectedEntity ? this._game.selectedEntity : false;
        if (this._options.currentPlayer !== false) {
            entity = this._options.currentPlayer;
        }

        if (entity) {
            //console.log('[UPDATE]', entity.name, entity.health);
            this.setData(entity);
        }
    }
}
