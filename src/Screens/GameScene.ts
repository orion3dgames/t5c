import { Scene, Engine, Color4, Vector3, FreeCamera, HemisphericLight } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Button } from "@babylonjs/gui";
import State from "./Screens";

import { PlayerInput } from "../Controllers/inputController";
import { Player } from "../Entities/Player";
import { Cube } from "../Entities/Cube";

import { Room } from "colyseus.js";

export class GameScene {
    
    public _scene: Scene;
    private _engine: Engine;
    public _newState: State;
    private _gui: AdvancedDynamicTexture;
    public _button: Button;

    private _input;
    private _ui;
    
    public _roomId: string;
    private room: Room<any>;
    private playerEntities: Player[] = [];
    private _currentPlayer;

    constructor(engine, client) {
        this.create(engine, client);
    }

    public async create(engine, client) {

        // create scene
        let scene = new Scene(engine);

        //creates and positions a free camera
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero()); //targets the camera to scene origin

        // set up ui
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI"); 
        guiMenu.idealHeight = 720;

        const imageRect = new Rectangle("titleContainer");
        imageRect.width = 1;
        imageRect.height = 1;
        imageRect.background = "#999999";
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

        const startBtn = Button.CreateSimpleButton("play", "EXIT");
        startBtn.fontFamily = "Viga";
        startBtn.width = 0.2
        startBtn.height = "40px";
        startBtn.color = "white";
        startBtn.top = "-60px";
        startBtn.thickness = 1;
        startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        startBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        imageRect.addControl(startBtn);
        this._button = startBtn;

        // setup events
        this._button.onPointerDownObservable.add(() => { 
            this.room.leave();
            this._newState = State.START;
        });

        // add light
        var light = new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);

        // 
        this._scene = scene;

        if(this._roomId){
            this.room = await client.join("my_room", { roomId: this._roomId });
        }else{
            this.room = await client.create("my_room");
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
            this.playerEntities[sessionId].mesh.dispose();
            delete this.playerEntities[sessionId];
        });

        // when a cube is added
        this.room.state.cubes.onAdd((entity, sessionId) => {
            console.log('CUBE ADDED', entity, sessionId);
            let cube = new Cube(entity, scene);
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

        })

    }

}