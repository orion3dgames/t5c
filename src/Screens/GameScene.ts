import { Scene, Engine, Color4, Vector3, FreeCamera, HemisphericLight, MeshBuilder, SpotLight, ShadowGenerator } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Button } from "@babylonjs/gui";
import State from "./Screens";

import { PlayerInput } from "../Controllers/inputController";
import { Hud } from "../Controllers/ui";
import { Player } from "../Entities/Player";
import { Cube } from "../Entities/Cube";

import { Room } from "colyseus.js";
import { Console } from "console";

export class GameScene {

    public _scene: Scene;
    private _engine: Engine;
    public _newState: State;
    private _gui: AdvancedDynamicTexture;
    public _button: Button;

    private _input;
    private _ui;
    private _shadow: ShadowGenerator;

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
        scene.shadowsEnabled = true;

        // set up some lights
        const light = new SpotLight("spotLight", new Vector3(-40, 40, -40), new Vector3(1, -1, 1), Math.PI / 5, 30, scene);
        light.position = new Vector3(-40, 40, -40);
        light.shadowMaxZ = 100;
        light.shadowMinZ = 10;

        const plane = MeshBuilder.CreatePlane("plane", { size: 30 }, scene);
        plane.position.y = 0;
        plane.rotation.x = Math.PI / 2;
        plane.receiveShadows = true;

        // shadow generator
        this._shadow = new ShadowGenerator(1024, light);
        this._shadow.bias = 0.001;
        this._shadow.normalBias = 0.02;
        this._shadow.useContactHardeningShadow = true;
        this._shadow.contactHardeningLightSizeUVRatio = 0.05;
        this._shadow.setDarkness(0.5);

        // set scene
        this._scene = scene;

        await this._initNetwork(client);

    }

    private async _initNetwork(client): Promise<void> {

        await this._scene.whenReadyAsync();

        try {

            if (this._roomId) {
                this.room = await client.join("game_room", { roomId: this._roomId });
            } else {
                this.room = await client.create("game_room");
                this._roomId = this.room.roomId;
                window.currentRoomID = this._roomId;
            }

            if (this.room) {
                await this._initEvents();
            }

        } catch (e) {
            console.error("join error", e);
        }

    }

    private async _initEvents() {

        // setup player input
        // todo: probably should be in the player class
        this._input = new PlayerInput(this._scene);

        // setup hud
        this._ui = new Hud(this._scene, this.room);

        // when someone joins the room event
        this.room.state.players.onAdd((entity, sessionId) => {

            var isCurrentPlayer = sessionId === this.room.sessionId;

            let _player = new Player(entity, isCurrentPlayer, sessionId, this._scene, this._ui, this._input, this._shadow);

            // if current player, save entity ref
            if (isCurrentPlayer) {

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
            this.playerEntities[sessionId].mesh.dispose();
            delete this.playerEntities[sessionId];
        });

        // when a cube is added
        /*
        this.room.state.cubes.onAdd((entity, sessionId) => {
            new Cube(entity, this._scene);
        });*/

        // main loop
        let timeThen = Date.now();
        this._scene.registerBeforeRender(() => {

            // continuously lerp movement
            for (let sessionId in this.playerEntities) {
                const entity = this.playerEntities[sessionId];
                entity.mesh.position = Vector3.Lerp(entity.mesh.position, entity.playerPosition, 0.2);
                entity.mesh.rotation = Vector3.Lerp(entity.mesh.rotation, entity.playerDirection, 0.8);;
            }

            // main game loop
            let timeNow = Date.now();
            let timePassed = (timeNow - timeThen) / 1000;
            let updateRate = .2;
            if (timePassed >= updateRate) {

                // detect movement
                if (this._input.moving) {
                    this._currentPlayer.processMove();
                    /*
                    this.room.send("playerPosition", {
                        x: this._currentPlayer.playerNextPosition.x,
                        y: this._currentPlayer.playerNextPosition.y,
                        z: this._currentPlayer.playerNextPosition.z
                    });
                    this.room.send("playerDirection", {
                        rotationY: this._currentPlayer.playerNextRotation,
                    });*/
                }

                timeThen = timeNow;
            }

        })

    }

}