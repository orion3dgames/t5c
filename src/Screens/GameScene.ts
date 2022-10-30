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

    constructor() {

    }

    async createScene(engine, client, roomId): Promise<void> {

        this._roomId = roomId;

        // create scene
        let scene = new Scene(engine);

        // set color
        //scene.clearColor = new Color4(0, 0, 0, 1);

        // set up some lights
        var light = new HemisphericLight(
            "light1",
            new Vector3(0, 1, 0),
            scene
          );

        console.log('BEFORE NETWORK');

        this._scene = scene;

        await this._initNetwork(client);
       
    }

    private async _initNetwork(client): Promise<void> {

        await this._scene.whenReadyAsync();

        // networking
        if(this._roomId){
            this.room = await client.join("my_room", { roomId: this._roomId });
        }else{
            this.room = await client.create("my_room");
        } 

        await this._initEvents();

    }

    private async _setupGUI(){

         // set up ui
         const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this._scene); 
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
         startBtn.top = "10px";
         startBtn.left = '-10px';
         startBtn.thickness = 1;
         startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
         startBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
         imageRect.addControl(startBtn);
 
         // setup events
         startBtn.onPointerDownObservable.add(() => { 
             this.room.leave();
             this._newState = State.START;
         });

    }

    private async _initEvents(){

        // draw gui
        this._setupGUI();

        // when someone joins the room event
        this.room.state.players.onAdd((entity, sessionId) => {

            var isCurrentPlayer = sessionId === this.room.sessionId;

            this._input = new PlayerInput(this._scene); //detect keyboard inputs

            let _player = new Player(entity, isCurrentPlayer, sessionId, this._scene, this._input);

            if(isCurrentPlayer){
                this._currentPlayer = _player;
                this._currentPlayer.activatePlayerCamera();
                console.log('ADDING CURRENT PLAYER', entity, this._currentPlayer);
            }else{
                console.log('NOT PLAYER');
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
            //console.log('CUBE ADDED', entity, sessionId);
            let cube = new Cube(entity, this._scene);
        });

        //--Transition post process--
        let timeThen = Date.now();   
        this._scene.registerBeforeRender(() => {

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
                    console.log(this._currentPlayer.playerNextPosition);
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