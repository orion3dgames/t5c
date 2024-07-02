if (process.env.NODE_ENV !== "production") {
    import("@babylonjs/core/Debug/debugLayer");
    import("@babylonjs/inspector");
}

// ES6 IMPORTS
// if there are cases where es6 dependencies could be causing issues just try and load the whole babylon core, and
// that fixes it, then it is a dependencies issue, check this link out for answers.
// bjs post: https://forum.babylonjs.com/t/pickedmesh-is-null-in-onpointerobservable-after-update-to-6-25-0/45076/7
// bjs docs: https://doc.babylonjs.com/setup/frameworkPackages/es6Support#faq
import "@babylonjs/core/Culling/ray";
import "@babylonjs/core/Animations/animatable";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/loaders/glTF/2.0/glTFLoader";
import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_pbrSpecularGlossiness";
import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_draco_mesh_compression";
import "@babylonjs/core/Rendering/depthRendererSceneComponent";
import "@babylonjs/core/Rendering/outlineRenderer";
import "@babylonjs/core/Audio/audioSceneComponent";

import { Engine } from "@babylonjs/core/Engines/engine";

// IMPORT SCREEN
import State from "./Screens/Screens";
import { LoginScene } from "./Screens/LoginScene";
import { CharacterSelectionScene } from "./Screens/CharacterSelection";
import { CharacterEditor } from "./Screens/CharacterEditor";
import { GameScene } from "./Screens/GameScene";
import { DebugScene } from "./Screens/DebugScene";

import { Config } from "../shared/Config";
import { Loading } from "./Controllers/Loading";
import { isLocal } from "./Utils";

import { GameController } from "./Controllers/GameController";

// App class is our entire game application
class App {
    // babylon
    public canvas;
    public engine: Engine;
    public config: Config;
    public game: GameController;

    constructor() {
        // create canvas
        this.canvas = document.getElementById("renderCanvas");

        // set config
        this.config = new Config();

        // initialize babylon scene and engine
        this._init();
    }

    private async _init(): Promise<void> {
        // create engine
        this.engine = new Engine(this.canvas, true, {
            adaptToDeviceRatio: true,
            antialias: true,
        });

        //
        this.engine.setHardwareScalingLevel(1);

        // loading
        var loadingScreen = new Loading("Loading Assets...");
        this.engine.loadingScreen = loadingScreen;

        // preload game data
        this.game = new GameController(this);
        await this.game.initializeGameData();

        // set default scene
        let defaultScene = isLocal() ? State.GAME : State.LOGIN;
        this.game.setScene(defaultScene);

        // main render loop & state machine
        await this._render();
    }

    private async _render(): Promise<void> {
        // render loop
        this.engine.runRenderLoop(() => {
            // monitor state
            this.game.state = this.checkForSceneChange();

            switch (this.game.state) {
                ///////////////////////////////////////
                // LOGIN SCENE
                case State.LOGIN:
                    this.clearScene();
                    this.game.currentScene = new LoginScene();
                    this.createScene();
                    break;

                ///////////////////////////////////////
                // CHARACTER SELECTION SCENE
                case State.CHARACTER_SELECTION:
                    this.clearScene();
                    this.game.currentScene = new CharacterSelectionScene();
                    this.createScene();
                    break;

                ///////////////////////////////////////
                // CHARACTER SELECTION SCENE
                case State.CHARACTER_EDITOR:
                    this.clearScene();
                    this.game.currentScene = new CharacterEditor();
                    this.createScene();
                    break;

                ///////////////////////////////////////
                // GAME
                case State.GAME:
                    this.clearScene();
                    this.game.currentScene = new GameScene();
                    this.createScene();
                    break;

                ///////////////////////////////////////
                // DEBUG
                case State.DEBUG_SCENE:
                    this.clearScene();
                    this.game.currentScene = new DebugScene();
                    this.createScene();
                    break;

                default:
                    break;
            }

            // render when scene is ready
            this._process();
        });

        //for development: make inspector visible/invisible
        //if (isLocal()) {
        window.addEventListener("keydown", (ev) => {
            //Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this.game.scene.debugLayer.isVisible()) {
                    this.game.scene.debugLayer.hide();
                } else {
                    this.game.scene.debugLayer.show();
                }
            }
        });
        //}

        //resize if the screen is resized/rotated
        window.addEventListener("resize", () => {
            this.engine.resize();
            if (this.game.currentScene && this.game.currentScene.resize) {
                this.game.currentScene.resize();
            }
        });
    }

    private createScene() {
        this.game.currentScene.createScene(this.game);
        this.game.scene = this.game.currentScene._scene;
        this.game.state = State.NULL;
    }

    private checkForSceneChange() {
        let currentScene = this.game.nextScene;
        if (this.game.nextScene !== State.NULL) {
            this.game.nextScene = State.NULL;
            return currentScene;
        }
    }

    private async _process(): Promise<void> {
        // make sure scene and camera is initialized
        if (this.game.scene && this.game.scene.activeCamera) {
            // render scene
            //this.game.currentScene.engineUpdate();
            this.game.scene.render();
        }
    }

    private clearScene() {
        if (this.game.scene) {
            this.game.engine.displayLoadingUI();
            this.game.scene.detachControl();
            this.game.scene.dispose();
            this.game.currentScene = null;
        }
    }
}
new App();
