import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { countPlayers, roundTo } from "../../../shared/Utils";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { generatePanel } from "./Theme";
import { ServerMsg } from "../../../shared/types";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { SceneInstrumentation } from "@babylonjs/core/Instrumentation/sceneInstrumentation";

export class DebugBox {
    private _playerUI;
    private _engine: Engine;
    private _scene: Scene;
    private _room;
    private _currentPlayer;
    private _entities;
    public ping: number = 0;
    public _debugPanel: Rectangle;
    private _debugTextUI;
    private instrumentation: SceneInstrumentation;
    private currentDrawCallCounter: number = 0;

    constructor(_playerUI, _engine: Engine, _scene: Scene, _room, _currentPlayer, _entities) {
        this._playerUI = _playerUI;
        this._engine = _engine;
        this._scene = _scene;
        this._room = _room;
        this._currentPlayer = _currentPlayer;
        this._entities = _entities;

        this.instrumentation = new SceneInstrumentation(this._scene);

        this._createUI();

        // on pong
        this._room.onMessage(ServerMsg.PONG, (data) => {
            let dateNow = Date.now();
            this.ping = dateNow - data.date;
        });
    }

    _createUI() {
        const debugPanel = generatePanel("debugPanel", "160px;", "260px", "-100px", "-15px");
        debugPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        debugPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        debugPanel.isVisible = false;
        this._playerUI.addControl(debugPanel);
        this._debugPanel = debugPanel;

        const debugText = new TextBlock("debugText");
        debugText.color = "#FFF";
        debugText.top = "5px";
        debugText.left = "-5px";
        debugText.fontSize = "12px;";
        debugText.resizeToFit = true;
        debugText.text = "TEXT";
        debugText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        debugText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        debugText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        debugText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        debugPanel.addControl(debugText);
        this._debugTextUI = debugText;

        debugPanel.onPointerClickObservable.add(() => {
            navigator.clipboard.writeText(
                `new Vector3(${roundTo(this._currentPlayer.x, 2)}, ${roundTo(this._currentPlayer.y, 2)}, ${roundTo(this._currentPlayer.z, 2)})`
            );
        });
    }

    // debug panel refresh
    public update() {
        // only update if visible
        if (this._debugPanel.isVisible === false) {
            return false;
        }

        let entityCount = this._entities.size;
        let count = 0;
        this._entities.forEach((element) => {
            if (element.mesh && element.mesh.isEnabled()) {
                count += 1;
            }
        });

        let locationText = "";
        locationText += "Total Nodes: " + entityCount + " \n";
        locationText += "Visible Nodes: " + count + " \n";
        locationText += "FPS: " + roundTo(this._engine.getFps(), 0) + " \n";
        locationText += "Draw Calls: " + this.instrumentation.drawCallsCounter.current + " \n";
        locationText += "Total Meshes: " + this._scene.meshes.length + " \n\n";

        locationText += "Ping: " + this.ping + "ms\n";
        locationText += "X: " + roundTo(this._currentPlayer.x, 2) + "\n";
        locationText += "y: " + roundTo(this._currentPlayer.y, 2) + "\n";
        locationText += "z: " + roundTo(this._currentPlayer.z, 2) + "\n";
        locationText += "Rot: " + roundTo(this._currentPlayer.rot, 2) + "\n";

        locationText += "Press N: Toggle Navmesh\n";
        locationText += "Press H: Toggle Map\n";
        locationText += "Press J: Remove Entities\n";
        this._debugTextUI.text = locationText;
    }
}
