import { Scene, Engine, Color4, Vector3, FreeCamera, HemisphericLight } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Button } from "@babylonjs/gui";
import State from "./Screens";

import { PlayerInput } from "../Controllers/inputController";
import { Hud } from "../Controllers/ui";
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

    async createScene(engine, client): Promise<void> {

        // get current roomID from globals
        this._roomId = window.currentRoomID;

        // create scene
        let scene = new Scene(engine);

        // set up some lights
        var light = new HemisphericLight(
            "light1",
            new Vector3(0, 1, 0),
            scene
          );
        
        // set scene
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
            this._roomId = this.room.roomId;
            window.currentRoomID = this._roomId;
        } 

        await this._initEvents();

    }

    private async _initEvents(){

        // setup player input
        // todo: probably should be in the player class
        this._input = new PlayerInput(this._scene);
        
        // setup hud
        this._ui = new Hud(this._scene, this.room); 

        // add a quit button
        // todo: should be in the hud class, not sure how to propagate the state to the main game loop
        // we need a global game variable that can be accessed from anywhere
        const quitButton = Button.CreateSimpleButton("quit", "Quit");
        quitButton.fontFamily = "Viga";
        quitButton.width = 0.2
        quitButton.height = "40px";
        quitButton.color = "white";
        quitButton.top = "20px"; 
        quitButton.left = "-20px"; 
        quitButton.thickness = 1;
        quitButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        quitButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._ui._playerUI.addControl(quitButton);

        quitButton.onPointerDownObservable.add(() => { 
            this.room.leave();
            window.nextScene = State.START;
        });

        // when someone joins the room event
        this.room.state.players.onAdd((entity, sessionId) => {

            var isCurrentPlayer = sessionId === this.room.sessionId;

            let _player = new Player(entity, isCurrentPlayer, sessionId, this._scene, this._ui, this._input);

            // if current player, save entity ref
            if(isCurrentPlayer){

                // set currentPlayer (probably not useful)
                this._currentPlayer = _player;

                //this._setupGUI();
                console.log('ADDING CURRENT PLAYER', entity, this._currentPlayer);
            }

            // save entity
            this.playerEntities[sessionId] = _player;

        });

        // when someone leave the room event
        this.room.state.players.onRemove((player, sessionId) => {
            console.log('Client left', player, sessionId);
            this.playerEntities[sessionId].mesh.dispose();
            this._roomId = "";
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
            let updateRate = .1;          
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