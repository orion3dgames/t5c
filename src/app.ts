import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";

import { Engine, Scene, Vector3, Mesh, Color3, Color4, ShadowGenerator, PointLight, FreeCamera, Sound, Matrix, MeshBuilder, Quaternion, EngineFactory } from "@babylonjs/core";
import { PlayerInput } from "./inputController";
import { Player } from "./characterController";
import { Hud } from "./ui";
import { AdvancedDynamicTexture, Button, TextBlock, Rectangle, Control, Image, ScrollViewer } from "@babylonjs/gui";
import { NormalMaterial, CustomMaterial, SimpleMaterial } from "@babylonjs/materials";
import { Environment } from "./environment";

// colyseus
import * as Colyseus from "colyseus.js"; // not necessary if included via <script> tag.
import { Room, RoomAvailable } from "colyseus.js";

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
    private _currentPlayer: Player;
    private _ui: Hud;
    private _environment;
    private _client;

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
    private allRooms: RoomAvailable[] = [];
    private room: Room<any>;
    private lobbyRoom: Room<any>;
    private roomId = "";
    private playerEntities: Player[] = [];

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

        this._client = new Colyseus.Client('ws://orbiter-colyseus.web.app:2567');

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
        //await this._goToGame();
        await this._goToStart();

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

        const imageRect = new Rectangle("titleContainer");
        imageRect.width = 1;
        imageRect.height = 1;
        imageRect.background = "#999999";
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

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
        imageRect.height = 1;
        imageRect.background = "#999999";
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
        startBtn.top = "-90px";
        startBtn.thickness = 1;
        startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        imageRect.addControl(startBtn);
 
        const backButton = Button.CreateSimpleButton("back", "Back");
        backButton.fontFamily = "Viga";
        backButton.width = 0.2
        backButton.height = "40px";
        backButton.color = "white";
        backButton.top = "-30px";
        backButton.thickness = 1;
        backButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        imageRect.addControl(backButton);

        //this handles interactions with the start button attached to the scene
        startBtn.onPointerDownObservable.add(() => { 
            sfx.play();
            scene.detachControl(); //observables disabled
            this.lobbyRoom.removeAllListeners();
            this._goToGame();
        });

        //this handles interactions with the start button attached to the scene
        backButton.onPointerDownObservable.add(() => { 
            sfx.play();
            scene.detachControl(); //observables disabled
            this._goToStart();
        });


        //--SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI(); //when the scene is ready, hide loading

        //lastly set the current state to the start state and set the scene to the start scene
        this._scene.dispose();
        this._scene = scene;
        this._state = State.LOBBY;

        //////////////////////////////////////////////////////
        // LOBBY

        // add scrollable container
        var sv = new ScrollViewer();
        sv.width = 0.8;
        sv.height = 0.6;
        sv.background = "#CCCCCC";
        sv.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        sv.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        imageRect.addControl(sv);

        // join lobby
        this._client.joinOrCreate("lobby").then((lobby) => {
    
            this.lobbyRoom = lobby;

            this.lobbyRoom.onMessage("rooms", (rooms) => {
                console.log('rooms');
                this.allRooms = rooms;
                this._refreshLobbyUI(sv);
            });
    
            this.lobbyRoom.onMessage("+", ([roomId, room]) => {
                console.log('+ room');
                const roomIndex = this.allRooms.findIndex((room) => room.roomId === roomId);
                if (roomIndex !== -1) {
                    this.allRooms[roomIndex] = room;
                } else {
                    this.allRooms.push(room);
                }
                this._refreshLobbyUI(sv);
            });
    
            this.lobbyRoom.onMessage("-", (roomId) => {
                console.log('- room');
                this.allRooms = this.allRooms.filter((room) => room.roomId !== roomId);
                this._refreshLobbyUI(sv);
            });

        })
        
    }

    private _refreshLobbyUI(sv){
    
        var top = 0;
        this.allRooms.forEach(room => {

            var roomTxt = new TextBlock();
            roomTxt.text = "Room | Players "+room.clients+"/10";
            roomTxt.textHorizontalAlignment = 0;
            roomTxt.fontFamily = "Viga";
            roomTxt.height = "30px";
            roomTxt.fontSize = "16px";
            roomTxt.color = "white";
            roomTxt.left = .1;
            roomTxt.top = top+"px";
            roomTxt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            sv.addControl(roomTxt);

            let joinBtn = Button.CreateSimpleButton("back", "JOIN");
            joinBtn.fontFamily = "Viga";
            joinBtn.width = .2
            joinBtn.height = "30px";
            joinBtn.fontSize = "16px";
            joinBtn.color = "white";
            joinBtn.top = top+"px";
            joinBtn.thickness = 1;
            joinBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            sv.addControl(joinBtn);

            top += 40;
        
            //this handles interactions with the start button attached to the scene
            joinBtn.onPointerDownObservable.add(() => { 
                this.roomId = room.roomId;
                this.lobbyRoom.removeAllListeners();
                this._goToGame();
                
            });
        });
        
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

        //Initializes the game's loop
        await this._initializeGameAsync(scene); //handles scene related updates & setting up meshes in scene

        //--WHEN SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        
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

    //init game
    private async _initializeGameAsync(scene): Promise<void> {

        // join or create room
        console.log('LOGGING IN TO ROOM', this.roomId);

        if(this.roomId){
            this.room = await this._client.join("my_room", { roomId: this.roomId });
        }else{
            this.room = await this._client.create("my_room");
        }

        // when someone joins the room event
        this.room.state.players.onAdd((entity, sessionId) => {

            var isCurrentPlayer = sessionId === this.room.sessionId;
        
            this._input = new PlayerInput(scene, this._ui); //detect keyboard/mobile inputs

            let _player = new Player(entity, isCurrentPlayer, sessionId, scene, this._input);

            if(isCurrentPlayer){
                this._currentPlayer = _player;
                this._currentPlayer.activatePlayerCamera();
                console.log('ADDING CURRENT PLAYER', entity, this._currentPlayer);
            }else{
                console.log('ADDING CURRENT PLAYER', entity, this._currentPlayer);
            }

            this.playerEntities[sessionId] = _player;

        });

        // when someone leave the room event
        this.room.state.players.onRemove((player, sessionId) => {
            console.log('Client left', player, sessionId);
            scene.playerEntities[sessionId].mesh.dispose();
            delete scene.playerEntities[sessionId];
        });

        //--Transition post process--
        
        let timeThen = Date.now();   
        scene.registerBeforeRender(() => {

            // continuously lerp movement
            for (let sessionId in this.playerEntities) {
                const entity = this.playerEntities[sessionId];
                const targetPosition = entity.playerNextPosition;
                entity.mesh.position = Vector3.Lerp(entity.mesh.position, targetPosition, 0.05);
            }

            // prepare game loop
            let timeNow = Date.now();   
            let timePassed = (timeNow - timeThen) / 1000;
            let updateRate = .5;          
            if( timePassed >= updateRate){

                console.log('GAME LOOP UPDATE '+updateRate+' SECONDS');

                // detect movement
                if(this._input.horizontalAxis || this._input.verticalAxis ){
                    this._currentPlayer.processMove();
                    this.room.send("updatePosition", {
                        x: this._currentPlayer.playerNextPosition.x,
                        y: this._currentPlayer.playerNextPosition.y,
                        z: this._currentPlayer.playerNextPosition.z,
                    });
                }

                timeThen = timeNow;
            }              


            // fade scene leave
            if (this._ui.transition) {
                this._ui.fadeLevel -= .05;
                //once the fade transition has complete, switch scenes
                if(this._ui.fadeLevel <= 0) {
                    this._ui.quit = true;
                    this._ui.transition = false;
                }
            }
        })

        // game loop
        scene.onBeforeRenderObservable.add(() => {
                        
            if(this._ui.transition){
                this.room.leave();
                this._goToStart();
            }

        })

        //webpack served from public       
    }
}
new App();