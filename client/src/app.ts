import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";

import { Engine, Scene, Vector3, Mesh, Color3, Color4, ShadowGenerator, PointLight, FreeCamera, Sound, Matrix, MeshBuilder, Quaternion, EngineFactory } from "@babylonjs/core";
import { PlayerInput } from "./inputController";
import { Player } from "./characterController";
import { Hud } from "./ui";
import { AdvancedDynamicTexture, Button, TextBlock, Rectangle, Control, Image } from "@babylonjs/gui";
import { Environment } from "./environment";

// colyseus
import { Room } from "colyseus.js";

//enum for states
enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3, LOBBY = 4 }

// App class is our entire game application
class App {
    // General Entire Application
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;

    //Game State Related
    public assets;
    private _input: PlayerInput;
    private _player: Player;
    private _ui: Hud;
    private _environment;

    //Sounds
    // public sfx: Sound;
    public game: Sound;
    public end: Sound;

    //Scene - related
    private _state: number = 0;
    private _gamescene: Scene;
    private _cutScene: Scene;

    //post process
    private _transition: boolean = false;

    // multi
    private room: Room<any>;
    private playerEntities: { [playerId: string]: Player } = {};
    private playerNextPosition: { [playerId: string]: BABYLON.Vector3 } = {};

    constructor() {

        // create canvas
        this._canvas = this._createCanvas();

        // initialize babylon scene and engine
        this._init();
    }

    private async _init(): Promise<void> {

        this._engine = await EngineFactory.CreateAsync(this._canvas, {
            antialiasing: true
        }) as Engine;
 
        this._scene = new Scene(this._engine);

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

        //MAIN render loop & state machine
        await this._main();
    }

    private async _main(): Promise<void> {

        // debug 
        await this._goToGame();
        //await this._goToStart();

        // Register a render loop to repeatedly render the scene
        this._engine.runRenderLoop(() => {
            switch (this._state) {

                case State.START:
                    this._scene.render();
                    break;

                case State.CUTSCENE:
                    this._scene.render();
                    break;

                case State.LOBBY:
                    this._scene.render();
                    break;

                case State.GAME:
                    /*
                    if (this._ui.quit) {
                        this._goToStart();
                        this._ui.quit = false;
                    }*/
                    this._scene.render();
                    break;

                case State.LOSE:
                    this._scene.render();
                    break;

                default: break;
            }
        });

        //resize if the screen is resized/rotated
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
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
    
    // goToStart
    private async _goToStart() {
        this._engine.displayLoadingUI(); //make sure to wait for start to load

        //--SCENE SETUP--
        //dont detect any inputs from this ui while the game is loading
        this._scene.detachControl();
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        //creates and positions a free camera
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero()); //targets the camera to scene origin

        //--SOUNDS--
        /*
        const start = new Sound("startSong", "./sounds/copycat(revised).mp3", scene, function () {
        }, {
            volume: 0.25,
            loop: true,
            autoplay: true
        });*/

        const sfx = new Sound("selection", "./sounds/vgmenuselect.wav", scene, function () {
        });

        //--GUI--
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;

        //background image
        const imageRect = new Rectangle("titleContainer");
        imageRect.width = 1;
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

        const startbg = new Image("startbg", "sprites/start.jpeg");
        imageRect.addControl(startbg);

        const title = new TextBlock("title", "Orbiter 3D");
        title.resizeToFit = true;
        title.fontFamily = "Viga";
        title.fontSize = "40px";
        title.color = "white";
        title.resizeToFit = true;
        title.top = "14px";
        title.width = 0.8;
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        imageRect.addControl(title);

        const startBtn = Button.CreateSimpleButton("play", "Play");
        startBtn.fontFamily = "Viga";
        startBtn.width = 0.2
        startBtn.height = "40px";
        startBtn.color = "white";
        startBtn.top = "-60px";
        startBtn.thickness = 1;
        startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        imageRect.addControl(startBtn);

        //this handles interactions with the start button attached to the scene
        startBtn.onPointerDownObservable.add(() => { 
            //sounds
            sfx.play();
            
            scene.detachControl(); //observables disabled

            this._goToLobby();
        });

        //--SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI(); //when the scene is ready, hide loading

        //lastly set the current state to the start state and set the scene to the start scene
        this._scene.dispose();
        this._scene = scene;
        this._state = State.START;
    }

    // goToLobby
    private async _goToLobby() {

        this._engine.displayLoadingUI(); //make sure to wait for start to load

        //--SCENE SETUP--
        //dont detect any inputs from this ui while the game is loading
        this._scene.detachControl();
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        //creates and positions a free camera
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero()); //targets the camera to scene origin

        //--SOUNDS--
        const sfx = new Sound("selection", "./sounds/vgmenuselect.wav", scene, function () {
        });

        //--GUI--
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;

        //background image
        const imageRect = new Rectangle("titleContainer");
        imageRect.width = 1;
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

        const title = new TextBlock("title", "Lobby");
        title.resizeToFit = true;
        title.fontFamily = "Viga";
        title.fontSize = "40px";
        title.color = "white";
        title.resizeToFit = true;
        title.top = "14px";
        title.width = 0.8;
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        imageRect.addControl(title);

        const startBtn = Button.CreateSimpleButton("start", "Create");
        startBtn.fontFamily = "Viga";
        startBtn.width = 0.2
        startBtn.height = "40px";
        startBtn.color = "white";
        startBtn.top = "-60px";
        startBtn.thickness = 1;
        startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        imageRect.addControl(startBtn);

        //this handles interactions with the start button attached to the scene
        startBtn.onPointerDownObservable.add(() => { 
            //sounds
            sfx.play();
            
            scene.detachControl(); //observables disabled

            this._goToGame();
        });

        //--SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI(); //when the scene is ready, hide loading

        //lastly set the current state to the start state and set the scene to the start scene
        this._scene.dispose();
        this._scene = scene;
        this._state = State.LOBBY;
    }

    private async _setUpGame() { //async
        //--CREATE SCENE--
        let scene = new Scene(this._engine);
        this._gamescene = scene;

        //--SOUNDS--
        this._loadSounds(scene);

        //--CREATE ENVIRONMENT--
        const environment = new Environment(scene);
        this._environment = environment;

        //Load environment and character assets
        await this._environment.load(); //environment
        await this._loadCharacterAssets(scene); //character
    }

    //loading sounds for the game scene
    private _loadSounds(scene: Scene): void {

        this.game = new Sound("gameSong", "./sounds/Christmassynths.wav", scene, function () {
        }, {
            loop:true,
            volume: 0.1
        });

        this.end = new Sound("endSong", "./sounds/copycat(revised).mp3", scene, function () {
        }, {
            volume: 0.25
        });
    }

    //goToGame
    private async _goToGame(): Promise<void> {
        
        //--START LOADING AND SETTING UP THE GAME DURING THIS SCENE--
        await this._setUpGame();

        //--SETUP SCENE--
        this._scene.detachControl();
        let scene = this._gamescene;

        //--GUI--
        const ui = new Hud(scene);
        this._ui = ui;

        //dont detect any inputs from this ui while the game is loading
        scene.detachControl();

        //IBL (image based lighting) - to give scene an ambient light
        /*
        const envHdri = CubeTexture.CreateFromPrefilteredData("textures/envtext.env", scene);
        envHdri.name = "env";
        envHdri.gammaSpace = false;
        scene.environmentTexture = envHdri;
        scene.environmentIntensity = 0.02;*/

        //--INPUT--
        this._input = new PlayerInput(scene, this._ui); //detect keyboard/mobile inputs

        //Initializes the game's loop
        await this._initializeGameAsync(scene); //handles scene related updates & setting up meshes in scene

        //--WHEN SCENE FINISHED LOADING--
        await scene.whenReadyAsync();

        //Actions to complete once the game loop is setup
        //scene.getMeshByName("outer").position = scene.getTransformNodeByName("startPosition").getAbsolutePosition(); //move the player to the start position

        //set up the game timer and sparkler timer -- linked to the ui
        //this._ui.startTimer();
        
        //get rid of start scene, switch to gamescene and change states
        this._scene.dispose();
        this._state = State.GAME;
        this._scene = scene;
        this._engine.hideLoadingUI();

        //the game is ready, attach control back
        this._scene.attachControl();

        //--SOUNDS--
        //this.game.play(); // play the gamesong
    }

    //load the character model
    private async _loadCharacterAssets(scene): Promise<any> {

        async function loadCharacter() {

            //collision mesh
            const outer = MeshBuilder.CreateBox("outer", { width: 2, depth: 1, height: 3 }, scene);
            outer.isVisible = true;
            outer.isPickable = false;
            outer.checkCollisions = true;

            //move origin of box collider to the bottom of the mesh (to match player mesh)
            outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0))

            //for collisions
            outer.ellipsoid = new Vector3(1, 1.5, 1);
            outer.ellipsoidOffset = new Vector3(0, 1.5, 0);
            outer.rotationQuaternion = new Quaternion(0, 1, 0, 0); // rotate the player mesh 180 since we want to see the back of the player
            
            /*
            //--IMPORTING MESH--
            return SceneLoader.ImportMeshAsync(null, "./models/", "player.glb", scene).then((result) =>{
                const root = result.meshes[0];
                //body is our actual player mesh
                const body = root;
                body.parent = outer;
                body.isPickable = false;
                body.getChildMeshes().forEach(m => {
                    m.isPickable = false;
                })
                
                //return the mesh and animations
                return {
                    mesh: outer as Mesh,
                    animationGroups: result.animationGroups
                }
            });
            */
           //return the mesh and animations
           return {
                mesh: outer as Mesh,
                //animationGroups: result.animationGroups
            }
        }

        return loadCharacter().then(assets => {
            this.assets = assets;
        });
    }

    //init game
    private async _initializeGameAsync(scene): Promise<void> {

        scene.ambientColor = new Color3(0.34509803921568627, 0.5568627450980392, 0.8352941176470589);
        scene.clearColor = new Color4(0.01568627450980392, 0.01568627450980392, 0.20392156862745098);

        const light = new PointLight("sparklight", new Vector3(100, 200, 100), scene);
        light.diffuse = new Color3(0.08627450980392157, 0.10980392156862745, 0.15294117647058825);
        light.intensity = 15;
        light.radius = .02;

        const shadowGenerator = new ShadowGenerator(1024, light);
        shadowGenerator.darkness = 0.4;

        //Create the player
        this._player = new Player(this.assets, scene, shadowGenerator, this._input);

        // Activate the camera
        this._player.activatePlayerCamera();

        //--Transition post process--
        scene.registerBeforeRender(() => {
            if (this._ui.transition) {
                this._ui.fadeLevel -= .05;

                //once the fade transition has complete, switch scenes
                if(this._ui.fadeLevel <= 0) {
                    this._ui.quit = true;
                    this._ui.transition = false;
                }
            }
        })

        //--GAME LOOP--
        scene.onBeforeRenderObservable.add(() => {
            
            if(this._ui.transition){
                this._goToStart();
            }

        })

        //webpack served from public       
    }
}
new App();