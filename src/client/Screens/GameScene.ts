import { Scene, ScenePerformancePriority } from "@babylonjs/core/scene";
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
import { GameController } from "../Controllers/GameController";
import loadNavMeshFromString from "../Utils/loadNavMeshFromString";
import { PlayerInputs, ServerMsg } from "../../shared/types";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { VatController } from "../Controllers/VatController";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { PlayerCamera } from "../Entities/Player/PlayerCamera";
import { SoundController } from "../Controllers/SoundController";

export class GameScene {
    public _game: GameController;
    public _scene: Scene;
    public _input: PlayerInput;
    public _ui: UserInterface;
    public _shadow: ShadowGenerator;
    public _navMesh: NavMesh;
    public _navMeshDebug;
    public _camera: PlayerCamera;
    public _sound: SoundController;

    public _roomId: string;
    public room: Room<any>;
    public chatRoom: Room<any>;
    public _currentPlayer: Player;
    public _loadedAssets: AssetContainer[] = [];
    public gameData;

    public _entities: Map<string, Player | Entity | Item> = new Map();

    public toSpawnPlayer: Player;
    public toSpawnOthers: Map<string, Entity | Item> = new Map();
    public playerIsSpawned = false;

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

        // performance
        scene.performancePriority = ScenePerformancePriority.Intermediate;

        // get location details
        let location = this._game.currentLocation;

        // add background  color
        let color = location.skyColor;
        scene.clearColor = new Color4(color[0], color[1], color[2], color[3]);

        if (this._game.config.SHADOW_ON === true) {
            // shadow light
            // https://forum.babylonjs.com/t/shadow-doesnt-work-if-another-light-is-created-before-shadow-casting-light/39852/4
            var shadowLight = new DirectionalLight("DirectionalLight", new Vector3(-0.5, -5, -0.5), scene);
            //shadowLight.position = new Vector3(1, 10, 1);
            shadowLight.intensity = 1;
            shadowLight.autoCalcShadowZBounds = true;

            // performant shadow
            // some settings I have found looks good
            // https://forum.babylonjs.com/t/shadows-setup-for-large-usually-static-world/39636/11?u=oriongu
            const shadowGenerator = new ShadowGenerator(2048, shadowLight);
            shadowGenerator.enableSoftTransparentShadow = true;
            shadowGenerator.transparencyShadow = true;
            shadowGenerator.filter = ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP;
            this._shadow = shadowGenerator;
            // if you move anything you can force it to render by calling
            //this._shadow.getShadowMap().resetRefreshCounter();
        }

        // add sky
        if (location.sun) {
            // skybox
            const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
            const skyboxMaterial = new StandardMaterial("skyBox", scene);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.disableLighting = true;
            skybox.material = skyboxMaterial;
            skybox.infiniteDistance = true;
            skyboxMaterial.reflectionTexture = new CubeTexture("textures/skybox", scene);
            skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;

            // sunlight
            var sunLight = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
            sunLight.intensity = location.sunIntensity;
            sunLight.groundColor = new Color3(0.13, 0.13, 0.13);
            sunLight.specular = Color3.Black();
        }

        // add fog
        if (location.fog === true) {
            scene.fogMode = Scene.FOGMODE_LINEAR;
            scene.fogStart = 70.0;
            scene.fogEnd = 200.0;
            scene.fogColor = new Color3(0.9, 0.9, 0.85);
        }

        // load navmesh
        this._navMesh = await this.loadNavMesh(location.key);
        this._navMeshDebug = createConvexRegionHelper(this._navMesh, this._scene); // function to show the navmesh as a mesh in-game
        this._navMeshDebug.isVisible = false;

        // initialize assets controller & load level
        this._game.initializeAssetController(this._shadow);
        await this._game._assetsCtrl.loadLevel(location.key);
        this._game.engine.displayLoadingUI();

        // preload any skeletons and animation
        let spawns = location.dynamic.spawns ?? [];
        this._game._vatController = new VatController(this._game, spawns);
        await this._game._vatController.initialize();
        console.log("[VAT] fully loaded", this._game._vatController._entityData);

        // init network
        this._initNetwork();
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
        this._camera = new PlayerCamera(this);
        this._sound = new SoundController(this);

        // start music controller
        this._sound.play(this._game.currentLocation.music, true);

        ////////////////////////////////////////////////////
        //  when a entity joins the room event
        this.room.state.entities.onAdd((entity, sessionId) => {
            if (entity.type === "player" && entity.sessionId === this.room.sessionId) {
                this.toSpawnPlayer = entity;
            } else {
                this.toSpawnOthers.set(entity.sessionId, entity);
            }
        });

        // when an entity is removed
        this.room.state.entities.onRemove((entity, sessionId) => {
            if (this._entities.has(sessionId)) {
                this._entities.get(sessionId)?.remove();
                this._entities.delete(sessionId);
            }
        });

        ////////////////////////////////////////////////////
        // main game loop
        const lastUpdates = {
            SERVER: {
                RATE: this._game.config.updateRate ?? 100,
                TIME: Date.now(),
            },
            SLOW: {
                RATE: 1000,
                TIME: Date.now(),
            },
            PING: {
                RATE: 2000,
                TIME: Date.now(),
            },
            UI_SERVER: {
                RATE: 100,
                TIME: Date.now(),
            },
            UI_SLOW: {
                RATE: 1000,
                TIME: Date.now(),
            },
        };

        // start game loop
        this._scene.registerBeforeRender(() => {
            // get current delta
            let delta = this._game.engine.getFps();

            // process vat animations
            this._game._vatController.process(delta);

            // iterate through each items
            const currentTime = Date.now();
            if (this.playerIsSpawned) {
                this._entities.forEach((entity, sessionId) => {
                    // main entity update
                    entity.update(delta);

                    // server player gameloop
                    if (currentTime - lastUpdates.SERVER.TIME >= lastUpdates.SERVER.RATE) {
                        entity.updateServerRate(lastUpdates.SERVER.RATE);
                    }

                    // slow game loop
                    if (currentTime - lastUpdates.SLOW.TIME >= lastUpdates.SLOW.RATE) {
                        entity.updateSlowRate(lastUpdates.SLOW.RATE);
                        entity.lod(this._currentPlayer);
                    }
                });
            }

            // reset timers
            if (currentTime - lastUpdates.SERVER.TIME >= lastUpdates.SERVER.RATE) {
                lastUpdates.SERVER.TIME = currentTime;
            }
            if (currentTime - lastUpdates.SLOW.TIME >= lastUpdates.SLOW.RATE) {
                lastUpdates.SLOW.TIME = currentTime;
            }

            // game update loop
            if (currentTime - lastUpdates.PING.TIME >= lastUpdates.PING.RATE) {
                // send ping to server
                this._game.sendMessage(ServerMsg.PING);
                lastUpdates.PING.TIME = currentTime;
            }

            // ui update loop
            if (currentTime - lastUpdates.UI_SERVER.TIME >= lastUpdates.UI_SERVER.RATE) {
                this._ui.update();
                lastUpdates.UI_SERVER.TIME = currentTime;

                // spawn entities
                if (this.toSpawnOthers.size > 0) {
                    this.spawn();
                }
            }

            // spawn player
            if (!this.playerIsSpawned && this.toSpawnPlayer) {
                // create player entity
                let _player = new Player(this.toSpawnPlayer.sessionId, this._scene, this, this.toSpawnPlayer);

                // set currentPlayer
                this._currentPlayer = _player;

                // add player specific ui
                this._ui.setCurrentPlayer(_player);

                // add to entities
                this._entities.set(this.toSpawnPlayer.sessionId, _player);

                // player is loaded, let's hide the loading gui
                this._game.engine.hideLoadingUI();

                // only do it once
                this.playerIsSpawned = true;
            }
        });

        this._scene.registerAfterRender(() => {
            const currentTime = Date.now();

            // ui slow update loop
            if (currentTime - lastUpdates.UI_SLOW.TIME >= lastUpdates.UI_SLOW.RATE) {
                this._ui.slow_update();
                lastUpdates.UI_SLOW.TIME = currentTime;
            }
        });
    }

    engineUpdate() {}

    async spawn() {
        let amountToSpawn = 20;
        let i = 0;
        for (const value of this.toSpawnOthers) {
            let entity = value[1];
            i++;

            // if player
            if (entity.type === "player" || entity.type === "entity") {
                this._entities.set(entity.sessionId, new Entity(entity.sessionId, this._scene, this, entity));
            }

            // if item
            if (entity.type === "item") {
                this._entities.set(entity.sessionId, new Item(entity.sessionId, this._scene, entity, this.room, this._ui, this._game));
            }

            // remove
            this.toSpawnOthers.delete(entity.sessionId);

            // only spawn 1 every frame
            if (i > amountToSpawn) {
                break;
            }
        }
    }

    // triggered on resize event
    public resize() {
        if (this._ui) {
            this._ui.resize();
        }
    }
}
