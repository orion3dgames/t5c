import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { Scene } from "@babylonjs/core/scene";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";

import State from "./Screens";
import { PlayerInput } from "../Controllers/PlayerInput";
import { UserInterface } from "../Controllers/UserInterface";
import { Player } from "../Entities/Player";
import { Entity } from "../Entities/Entity";
import { Item } from "../Entities/Item";
import { Room } from "colyseus.js";
import { NavMesh } from "../../shared/Libs/yuka-min";

import { createConvexRegionHelper } from "../Utils/navMeshHelper";
import { mergeMesh } from "../Entities/Common/MeshHelper";
import { GameController } from "../Controllers/GameController";
import loadNavMeshFromString from "../Utils/loadNavMeshFromString";
import { PlayerInputs, ServerMsg } from "../../shared/types";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VatController } from "../Controllers/VatController";

export class GameScene {
    public _game: GameController;
    public _scene: Scene;
    private _input: PlayerInput;
    public _ui;
    private _shadow: CascadedShadowGenerator;
    private _navMesh: NavMesh;
    public _navMeshDebug;

    private _roomId: string;
    private room: Room<any>;
    private chatRoom: Room<any>;
    private _currentPlayer: Player;
    private _loadedAssets: AssetContainer[] = [];

    public gameData;

    public _entities: (Player | Entity | Item)[] = [];

    constructor() {}

    async createScene(game): Promise<void> {
        // app
        this._game = game;

        // show loading screen
        this._game.engine.displayLoadingUI();

        // create scene
        let scene = new Scene(this._game.engine);

        // set scene
        this._scene = scene;

        // if no user logged in, force a auto login
        // to be remove later or
        if (!this._game.isLoggedIn()) {
            await this._game.forceLogin();
        }

        // check if user token is valid
        let user = await this._game.isValidLogin();
        if (!user) {
            // if token not valid, send back to login screen
            this._game.setScene(State.LOGIN);
        }

        // get location details
        let location = this._game.currentLocation;

        // add background  color
        scene.clearColor = new Color4(location.skyColor, location.skyColor, location.skyColor, 1);

        // add sun
        if (location.sun) {
            var ambientLight = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
            ambientLight.intensity = location.sunIntensity;
            ambientLight.groundColor = new Color3(0.13, 0.13, 0.13);
            ambientLight.specular = Color3.Black();
        }

        // add fog
        if (location.fog === true) {
            scene.fogMode = Scene.FOGMODE_LINEAR;
            scene.fogStart = 60.0;
            scene.fogEnd = 120.0;
            scene.fogColor = new Color3(0.9, 0.9, 0.85);
        }

        // shadow light
        var light = new DirectionalLight("DirectionalLight", new Vector3(-1, -2, -1), scene);
        light.position = new Vector3(100, 100, 100);
        light.radius = 0.27;
        light.intensity = location.sunIntensity;
        light.autoCalcShadowZBounds = true;

        // shadow generator
        this._shadow = new CascadedShadowGenerator(1024, light);
        this._shadow.filteringQuality = CascadedShadowGenerator.QUALITY_LOW;
        this._shadow.lambda = 0.82;
        this._shadow.bias = 0.018;
        this._shadow.shadowMaxZ = 1000;
        this._shadow.stabilizeCascades = false;
        this._shadow.depthClamp = true;

        // load navmesh
        this._navMesh = await this.loadNavMesh(location.key);
        this._navMeshDebug = createConvexRegionHelper(this._navMesh, this._scene); // function to show the navmesh as a mesh in-game
        this._navMeshDebug.isVisible = false;

        // initialize assets controller & load level
        this._game.initializeAssetController();
        await this._game._assetsCtrl.loadLevel(location.key);
        await this._game._assetsCtrl.prepareItems();
        this._game.engine.displayLoadingUI();

        // preload any skeletons and animation
        let spawns = location.dynamic.spawns ?? [];
        this._game._vatController = new VatController(this._game, spawns);
        await this._game._vatController.initialize();

        console.log(this._game._vatController.entityData);

        // init network
        await this._initNetwork();
    }

    public async loadNavMesh(key) {
        return await loadNavMeshFromString(key);
    }

    private async _initNetwork(): Promise<void> {
        // join global chat room if not already connected
        if (!this._game.currentChat) {
            this._game.currentChat = await this._game.client.joinChatRoom({ name: this._game._currentCharacter.name });
        }

        // join the game room and use chat room session ID
        this.room = await this._game.client.joinOrCreateRoom(
            this._game._currentCharacter.location,
            this._game._currentUser.token,
            this._game._currentCharacter.id
        );
        this._game.currentRoom = this.room;

        if (this.room) {
            // set room onError evenmt
            this.room.onError((code, message) => {
                this._game.setScene(State.LOGIN);
            });

            // set room onLeave event
            this.room.onLeave((code) => {
                if (code === 1006) {
                    this._game.setScene(State.LOGIN);
                }
            });

            // initialize game
            await this._initGame();
        } else {
        }
    }

    private async _initGame() {
        // setup interface
        this._ui = new UserInterface(this._game, this._entities, this._currentPlayer);

        // setup input Controller
        this._input = new PlayerInput(this);

        ////////////////////////////////////////////////////
        //  when a entity joins the room event
        this.room.state.entities.onAdd((entity, sessionId) => {
            // if player
            if (entity.type === "player") {
                var isCurrentPlayer = sessionId === this.room.sessionId;
                //////////////////
                // if player type
                if (isCurrentPlayer) {
                    // create player entity
                    let _player = new Player(entity, this.room, this._scene, this._ui, this._shadow, this._navMesh, this._game, this._input, this._entities);

                    // set currentPlayer
                    this._currentPlayer = _player;

                    // add player specific ui
                    this._ui.setCurrentPlayer(_player);

                    // add to entities
                    this._entities[sessionId] = _player;

                    // player is loaded, let's hide the loading gui
                    this._game.engine.hideLoadingUI();

                    //////////////////
                    // else must be another player
                } else {
                    this._entities[sessionId] = new Entity(entity, this.room, this._scene, this._ui, this._shadow, this._navMesh, this._game);
                }
            }

            // if entity
            if (entity.type === "entity") {
                this._entities[sessionId] = new Entity(entity, this.room, this._scene, this._ui, this._shadow, this._navMesh, this._game);
            }

            // if item
            if (entity.type === "item") {
                this._entities[sessionId] = new Item(entity.sessionId, this._scene, entity, this.room, this._ui, this._game);
            }
        });

        // when an entity is removed
        this.room.state.entities.onRemove((entity, sessionId) => {
            if (this._entities[sessionId]) {
                this._entities[sessionId].remove();
                delete this._entities[sessionId];
            }
        });

        ////////////////////////////////////////////////////
        // main game loop
        let timeServer = Date.now();
        let timeServerSlow = Date.now();
        let sequence = 0;
        let latestInput: PlayerInputs;
        this._scene.registerBeforeRender(() => {
            let delta = this._game.engine.getFps();
            let timeNow = Date.now();

            // entities update 60fps
            for (let sessionId in this._entities) {
                const entity = this._entities[sessionId];
                entity.update(delta);
                entity.lod(this._currentPlayer);
            }

            // process vat animations
            this._game._vatController.process();

            /////////////////
            // server update rate
            // every 5000ms loop
            let timePassedSlow = (timeNow - timeServerSlow) / 1000;
            let updateSlow = 5000 / 1000; // game is networked update every 100ms
            if (timePassedSlow >= updateSlow) {
                // send ping to server
                this.room.send(ServerMsg.PING, { date: Date.now() });

                // update entities
                for (let sessionId in this._entities) {
                    const entity = this._entities[sessionId];
                    if (entity && entity.type === "player") {
                        entity.updateSlowRate(5000);
                    }
                }

                // reset timer
                timeServerSlow = timeNow;
            }

            /////////////////
            // server update rate
            // every 100ms loop
            let timePassed = (timeNow - timeServer) / 1000;
            let updateRate = this._game.config.updateRate / 1000; // game is networked update every 100ms
            if (timePassed >= updateRate) {
                // player uppdate at server rate
                for (let sessionId in this._entities) {
                    const entity = this._entities[sessionId];
                    if (entity && entity.type === "player") {
                        entity.updateServerRate(this._game.config.updateRate);
                    }
                }

                // detect movement
                if (this._input.player_can_move && !this._currentPlayer.blocked) {
                    // increment seq
                    sequence++;

                    // prepare input to be sent
                    latestInput = {
                        seq: sequence,
                        h: this._input.horizontal,
                        v: this._input.vertical,
                    };

                    // sent current input to server for processing
                    this.room.send(ServerMsg.PLAYER_MOVE, latestInput);

                    // do client side prediction
                    this._currentPlayer.moveController.predictionMove(latestInput);
                }

                timeServer = timeNow;
            }
        });
    }

    // triggered on resize event
    public resize() {
        if (this._ui) {
            this._ui.resize();
        }
    }
}
