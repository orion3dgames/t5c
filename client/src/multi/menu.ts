import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { Client } from "colyseus.js";

import Game from './game';
import { createSkyBox } from "./utils";

const ROOM_NAME = "my_room";
const ENDPOINT = "ws://localhost:2567";
// const ENDPOINT = "wss://tutorial-babylonjs-server.glitch.me";

export default class Menu {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.ArcRotateCamera;
    private _advancedTexture: GUI.AdvancedDynamicTexture;

    private _colyseus: Client = new Client(ENDPOINT);

    private _errorMessage: GUI.TextBlock = new GUI.TextBlock("errorText");

    constructor(canvasElement: string) {
        // Create canvas and engine.
        this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this._engine = new BABYLON.Engine(this._canvas, true);
    }

    createMenu(): void {
        this._scene = new BABYLON.Scene(this._engine);
        this._camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, 1.0, 110, BABYLON.Vector3.Zero(), this._scene);
        this._camera.useAutoRotationBehavior = true;
        this._camera.setTarget(BABYLON.Vector3.Zero());
        this._advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        createSkyBox(this._scene);

        // Colyseus logo
        const controlBox = new GUI.Rectangle("controlBox");
        controlBox.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        controlBox.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        controlBox.height = "100%";
        controlBox.width = "40%";
        controlBox.thickness = 0;

        const logo = new GUI.Image("ColyseusLogo", "./public/colyseus.png");
        logo.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        logo.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        logo.height = "40%";
        logo.paddingTop = "10px";
        logo.stretch = GUI.Image.STRETCH_UNIFORM;
        controlBox.addControl(logo);

        // Button positioning
        const stackPanel = new GUI.StackPanel();
        stackPanel.isVertical = true;
        stackPanel.height = "50%";
        stackPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        stackPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;

        const createGameButton = this.createMenuButton("createGame", "CREATE GAME");
        createGameButton.onPointerClickObservable.add(async () => {
            this.swapControls(false);
            await this.createGame("create");
        });
        stackPanel.addControl(createGameButton);

        const joinGameButton = this.createMenuButton("joinGame", "JOIN GAME");
        joinGameButton.onPointerClickObservable.add(async () => {
            this.swapControls(false);
            await this.createGame("join");
        });
        stackPanel.addControl(joinGameButton);

        const createOrJoinButton = this.createMenuButton("createOrJoinGame", "CREATE OR JOIN");
        createOrJoinButton.onPointerClickObservable.add(async () => {
            this.swapControls(false);
            await this.createGame("joinOrCreate");
        });
        stackPanel.addControl(createOrJoinButton);

        controlBox.addControl(stackPanel);

        this._advancedTexture.addControl(controlBox);

        this.initLoadingMessageBox();
        this.initErrorMessageBox();
        this.swapLoadingMessageBox(false);
        this.swapErrorMessageBox(false);

        this.doRender();
    }

    private createMenuButton(name: string, text: string): GUI.Button {
        const button = GUI.Button.CreateImageWithCenterTextButton(name, text, "./public/btn-default.png");
        button.width = "45%";
        button.height = "55px";
        button.fontFamily = "Roboto";
        button.fontSize = "6%";
        button.thickness = 0;
        button.paddingTop = "10px"
        button.color = "#c0c0c0";
        return button;
    }

    private swapControls(isEnabled: boolean) {
        for (let btn of this._advancedTexture.getControlsByType("Button")) {
            btn.isEnabled = isEnabled;
        }
    }

    private async createGame(method: string): Promise<void> {
        let game: Game;
        try {
            switch (method) {
                case "create":
                    this.swapLoadingMessageBox(true);
                    game = new Game(this._canvas, this._engine, await this._colyseus.create(ROOM_NAME));
                    break;
                case "join":
                    this.swapLoadingMessageBox(true);
                    game = new Game(this._canvas, this._engine, await this._colyseus.join(ROOM_NAME));
                    break;
                default:
                    this.swapLoadingMessageBox(true);
                    game = new Game(this._canvas, this._engine, await this._colyseus.joinOrCreate(ROOM_NAME));
            }
            this._scene.dispose();
            game.bootstrap();
        } catch (error) {
            this._errorMessage.text = error.message;
            this.swapErrorMessageBox(true);
        }
    }

    private doRender(): void {
        // Run the render loop.
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }

    private initLoadingMessageBox() {
        const loadingMessage = new GUI.Rectangle("messageBox");
        loadingMessage.thickness = 0;
        loadingMessage.background = "#131313";

        const loadingText = new GUI.TextBlock("loadingText");
        loadingText.text = "LOADING..."
        loadingText.fontFamily = "Roboto";
        loadingText.color = "#fad836";
        loadingText.fontSize = "30px";
        loadingMessage.addControl(loadingText);

        this._advancedTexture.addControl(loadingMessage);
    }

    private initErrorMessageBox() {
        const errorMessageBox = new GUI.Rectangle("errorMessageBox");
        errorMessageBox.thickness = 0;
        errorMessageBox.background = "#131313";

        this._errorMessage.fontFamily = "Roboto";
        this._errorMessage.color = "#ff1616";
        this._errorMessage.fontSize = "20px";
        this._errorMessage.textWrapping = true;
        errorMessageBox.addControl(this._errorMessage);

        const button = GUI.Button.CreateImageWithCenterTextButton("tryAgainButton", "<- TRY AGAIN", "./public/btn-default.png");
        button.width = "200px";
        button.height = "60px";
        button.fontFamily = "Roboto";
        button.thickness = 0;
        button.color = "#c0c0c0";
        button.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        button.paddingBottom = "20px";
        button.onPointerClickObservable.add(() => {
            this.swapControls(true);
            this.swapLoadingMessageBox(false);
            this.swapErrorMessageBox(false);
        });
        errorMessageBox.addControl(button);

        this._advancedTexture.addControl(errorMessageBox);
    }

    private swapLoadingMessageBox(isEnabled: boolean) {
        const messageBox = this._advancedTexture.getControlByName("messageBox");
        messageBox.isEnabled = isEnabled;
        messageBox.alpha = isEnabled ? 0.75 : 0;
    }

    private swapErrorMessageBox(isEnabled: boolean) {
        this.swapLoadingMessageBox(false);

        const messageBox = this._advancedTexture.getControlByName("errorMessageBox");
        this._advancedTexture.getControlByName("tryAgainButton").isEnabled = true;
        messageBox.isEnabled = isEnabled;
        messageBox.alpha = isEnabled ? 0.75 : 0;
    }
}
