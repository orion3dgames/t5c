import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { countPlayers, roundTo } from "../../../shared/Utils";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";

export class UI_Debug {

    private _playerUI;
    private _engine:Engine;
    private _scene:Scene;
    private _gameRoom;
    private _currentPlayer;
    private _entities;
    private ping: number = 0;
    private _debugTextUI;

    constructor(_playerUI, _engine:Engine, _scene:Scene, _gameRoom, _currentPlayer, _entities) {

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

        // ping server every 5 seconds to get ping
        this._gameRoom.send("ping", { date: Date.now() });
        setInterval(()=>{
            this._gameRoom.send("ping", { date: Date.now() });
        }, 10000)

        // on teleport confirmation
        this._gameRoom.onMessage('pong', (data) => {
            let dateNow = Date.now();
            this.ping = dateNow - data.date;
        });

    }

    _createUI(){
 
        // add stack panel
        const debugPanel = new Rectangle("debugPanel");
        debugPanel.top = "90px;"
        debugPanel.left = "15px;"
        debugPanel.width = "190px;"
        debugPanel.adaptHeightToChildren = true;
        debugPanel.background = "rgba(0,0,0,.5)";
        debugPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        debugPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._playerUI.addControl(debugPanel);

        const debugText = new TextBlock("debugText");
        debugText.color = "#FFF";
        debugText.top = "5px"; 
        debugText.left = "5px";
        debugText.fontSize = "12px;";
        debugText.resizeToFit = true;
        debugText.text = "TEXT";
        debugText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        debugText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        debugText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        debugText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        debugPanel.addControl(debugText);

        this._debugTextUI = debugText;

    }

    // debug panel refresh
    private _update(){
        
        let locationText = "";
        locationText += "Total Entities: "+(countPlayers(this._entities) + 1)+" \n";
        locationText += "FPS: "+roundTo(this._engine.getFps(), 0)+" \n";
        locationText += "Ping: "+this.ping+"ms\n";
        this._debugTextUI.text = locationText;
    }


}