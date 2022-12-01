
import { isLocal } from "../shared/Utils";


import { Engine, Scene, EngineFactory } from "@babylonjs/core";

// IMPORT SCREEN
import State from "./Screens/Screens";
import { StartScene } from "./Screens/StartScene";
import { GameScene } from "./Screens/GameScene";
import { LoginScene } from "./Screens/LoginScene";
import { CharacterSelectionScene } from "./Screens/CharacterSelection";
import Config from "../shared/Config";
import { Network } from "./Controllers/Network";

// App class is our entire game application
class App {

    // General Entire Application
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;

    //Game State Related
    private _client;

    //Scene - related
    private _state: number = 0;
    private _currentScene;

    constructor() {

        // create canvas
        this._canvas = this._createCanvas();

        // initialize babylon scene and engine
        this._init();

        // setup default values
        Config.setDefault();
    }

    private async _init(): Promise<void> {

        // create engine
        this._engine = await EngineFactory.CreateAsync(this._canvas, {
            antialiasing: true
        }) as Engine;
 
        // create colyseus client
        // this should use environement values
        this._client = new Network(this._scene);

        //MAIN render loop & state machine
        await this._render();

    }

    private async _render(): Promise<void> {

        // render loop
        this._engine.runRenderLoop(() => {
            
            // monitor state
            this._state = Config.checkForSceneChange();

            switch (this._state) {

                ///////////////////////////////////////
                ///////////////////////////////////////
                ///////////////////////////////////////
                case State.START:
                    this.clearScene();
                    this._currentScene = new StartScene();
                    this._currentScene.createScene(this._engine);
                    this._scene = this._currentScene._scene;
                    this._state = State.NULL;
                    break;
    
                ///////////////////////////////////////
                ///////////////////////////////////////
                ///////////////////////////////////////
                case State.LOGIN:
                    this.clearScene();
                    this._currentScene = new LoginScene();
                    this._currentScene.createScene(this._engine, this._client);
                    this._scene = this._currentScene._scene;
                    this._state = State.NULL;
                    break;

                ///////////////////////////////////////
                ///////////////////////////////////////
                ///////////////////////////////////////
                case State.CHARACTER_SELECTION:
                    this.clearScene();
                    this._currentScene = new CharacterSelectionScene();
                    this._currentScene.createScene(this._engine, this._client);
                    this._scene = this._currentScene._scene;
                    this._state = State.NULL;
                    break;

                ///////////////////////////////////////
                ///////////////////////////////////////
                ///////////////////////////////////////
                case State.GAME:
                    this.clearScene();
                    this._currentScene = new GameScene();
                    this._currentScene.createScene(this._engine, this._client);
                    this._scene = this._currentScene._scene;
                    this._state = State.NULL;
                    break;
    
                default: break;
            } 
            
            // render when scene is ready
            this._process();

        });


        //resize if the screen is resized/rotated
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
        
    }

    private async _process(): Promise<void> {
        
        // make sure scene and camera is initialized
        if(this._scene && this._scene.activeCamera){

            //when the scene is ready, hide loading
            this._engine.hideLoadingUI(); 

            // render scene
            this._scene.render();
        }  
    }

    private clearScene() {
        if(this._scene){
            this._engine.displayLoadingUI();
            this._scene.detachControl();
            this._scene.dispose();
            this._currentScene = null;
        }
    }

    //set up the canvas
    private _createCanvas(): HTMLCanvasElement {

        document.documentElement.style["overflow"] = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.width = "100%";
        document.documentElement.style.height = "100%";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        
        document.body.style.overflow = "hidden";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        document.body.style.margin = "0";
        document.body.style.padding = "0";

        //create the canvas html element and attach it to the webpage
        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.id = "gameCanvas";
        document.body.appendChild(this._canvas);

        return this._canvas;
    }

}
new App();