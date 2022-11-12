import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

import { Engine, Scene, EngineFactory } from "@babylonjs/core";

// IMPORT SCREEN
import State from "./Screens/Screens";
import { StartScene } from "./Screens/StartScene";
import { LobbyScene } from "./Screens/LobbyScene";
import { GameScene } from "./Screens/GameScene";

// colyseus
import * as Colyseus from "colyseus.js";

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
    }

    private async _init(): Promise<void> {

        // create engine
        this._engine = await EngineFactory.CreateAsync(this._canvas, {
            antialiasing: true
        }) as Engine;
 
        // create colyseus client
        // this should use environement values
        this._client = new Colyseus.Client('ws://localhost:3000'); // local
        //this._client = new Colyseus.Client('wss://t5c.onrender.com'); // online using render.com

        //  start scene
        //this._state = State.START;
        window.nextScene = State.GAME;

        //MAIN render loop & state machine
        await this._render();

    }

    private async _render(): Promise<void> {

        console.log('RENDER START');

        // render loop
        this._engine.runRenderLoop(() => {

            // monitor state
            if(window.nextScene != State.NULL){
                this._state = window.nextScene;
                window.nextScene = State.NULL;
            }

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
                case State.LOBBY:
                    this.clearScene();
                    this._currentScene = new LobbyScene();
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

        //**for development: make inspector visible/invisible
        window.addEventListener("keydown", (ev) => {
            //Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
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
            console.log('CLEAR SCENE');
            this._engine.displayLoadingUI();
            this._scene.detachControl();
            this._scene.dispose();
            this._currentScene = null;
            this._scene = null;
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