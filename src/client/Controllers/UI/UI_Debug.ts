import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { countPlayers, roundToTwo } from "../../../shared/Utils";

export class UI_Debug {

    private _playerUI;
    private _engine;
    private _scene;
    private _gameRoom;
    private _currentPlayer;
    private _entities;

    private _debugTextUI;

    constructor(_playerUI, _engine, _scene, _gameRoom, _currentPlayer, _entities) {

        this._playerUI = _playerUI;
        this._engine = _engine;
        this._scene = _scene;
        this._gameRoom = _gameRoom;
        this._currentPlayer = _currentPlayer;
        this._entities = _entities;

        this._createUI();

        // some ui must be constantly refreshed as things change
        this._scene.registerBeforeRender(() => {

            // refresh
            this._update();
        });

    }

    _createUI(){
 
        // add stack panel
        const debugPanel = new Rectangle("debugPanel");
        debugPanel.top = "60px;"
        debugPanel.left = "20px;"
        debugPanel.width = "200px;"
        debugPanel.height = .2;
        debugPanel.background = "rgba(0,0,0,.5)";
        debugPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        debugPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._playerUI.addControl(debugPanel);

        const debugText = new TextBlock("debugText");
        debugText.color = "#FFF";
        debugText.top = "5px"; 
        debugText.left = "5px";
        debugText.fontSize = "18px;";
        debugText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        debugText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        debugText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        debugText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        debugPanel.addControl(debugText);

        this._debugTextUI = debugPanel;

    }

    // debug panel refresh
    private _update(){
        let locationText = "";
        locationText = "Zone: "+(global.T5C.currentLocation.title ?? 'undefined')+"\n";
        locationText += "RoomID: "+this._gameRoom.roomId+" \n";
        locationText += "PlayerID: "+this._gameRoom.sessionId+" \n";
        locationText += "Total Players: "+countPlayers(this._entities)+" \n";
        locationText += "FPS: "+roundToTwo(this._engine.getFps())+" \n";
        locationText += "Ping: 0.0ms \n";
        this._debugTextUI.text = locationText;
    }


}