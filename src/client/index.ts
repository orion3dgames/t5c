
if (process.env.NODE_ENV !== "production") {
    import("@babylonjs/core/Debug/debugLayer");
    import("@babylonjs/inspector");
}

import "@babylonjs/core/Animations/animatable";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/loaders/glTF/2.0/glTFLoader";
import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_pbrSpecularGlossiness";
import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_draco_mesh_compression";
import "@babylonjs/core/Rendering/depthRendererSceneComponent";
import "@babylonjs/core/Rendering/outlineRenderer";

import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";

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
import axios from "axios";

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

        // loading
        var loadingScreen = new Loading("Loading Assets...");
        this.engine.loadingScreen = loadingScreen;

        // preload game data
        this.game = new GameController(this);
        await this.game.initializeGameData();

        // set default scene
        this.game.setScene(this.config.defaultScene);

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
                    this.game.currentScene.createScene(this.game);
                    this.game.scene = this.game.currentScene._scene;
                    this.game.state = State.NULL;
                    break;

                ///////////////////////////////////////
                // CHARACTER SELECTION SCENE
                case State.CHARACTER_SELECTION:
                    this.clearScene();
                    this.game.currentScene = new CharacterSelectionScene();
                    this.game.currentScene.createScene(this.game);
                    this.game.scene = this.game.currentScene._scene;
                    this.game.state = State.NULL;
                    break;

                ///////////////////////////////////////
                // CHARACTER SELECTION SCENE
                case State.CHARACTER_EDITOR:
                    this.clearScene();
                    this.game.currentScene = new CharacterEditor();
                    this.game.currentScene.createScene(this.game);
                    this.game.scene = this.game.currentScene._scene;
                    this.game.state = State.NULL;
                    break;

                ///////////////////////////////////////
                // GAME
                case State.GAME:
                    this.clearScene();
                    this.game.currentScene = new GameScene();
                    this.game.currentScene.createScene(this.game);
                    this.game.scene = this.game.currentScene._scene;
                    this.game.state = State.NULL;
                    break;

                ///////////////////////////////////////
                // DEBUG
                case State.DEBUG_SCENE:
                    this.clearScene();
                    this.game.currentScene = new DebugScene();
                    this.game.currentScene.createScene(this.game);
                    this.game.scene = this.game.currentScene._scene;
                    this.game.state = State.NULL;
                    break;

                default:
                    break;
            }

            // render when scene is ready
            this._process();
        });

      
        if (isLocal()) {
            //**for development: make inspector visible/invisible
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
        }
        
        //resize if the screen is resized/rotated
        window.addEventListener("resize", () => {
            this.engine.resize();
            if (this.game.currentScene && this.game.currentScene.resize) {
                this.game.currentScene.resize();
            }
        });
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
            //when the scene is ready, hide loading
            this.engine.hideLoadingUI();

            // render scene
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
