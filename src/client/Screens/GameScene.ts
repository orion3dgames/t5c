import {
    Scene, Engine, Vector3, MeshBuilder, Color3, Color4, SpotLight,
    ShadowGenerator, CubeTexture, Texture, StandardMaterial,
    Mesh, Matrix, Quaternion, SceneLoader, 
    DirectionalLight, PointLight, HemisphericLight,
    AssetsManager, AssetContainer, MeshAssetTask, ContainerAssetTask
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Button } from "@babylonjs/gui";
import { } from "@babylonjs/materials";
import State from "./Screens";

import { PlayerInput } from "../Controllers/inputController";
import { Environment } from "../Controllers/environment";
import { Hud } from "../Controllers/ui";
import { Player } from "../../shared/Entities/Player";
import Config from '../../shared/Config';

import { Room } from "colyseus.js";
import { PlayerInputs } from "../../shared/types";
import { generateRandomPlayerName } from "../../shared/Utils";

export class GameScene {

    public _scene: Scene;
    public _client;
    private _engine: Engine;
    public _newState: State;
    private _gui: AdvancedDynamicTexture;
    public _button: Button;
    public _assetsManager: AssetsManager;
    public _assets = [];
    private _input;
    private _ui;
    private _shadow: ShadowGenerator;
    private _environment: Environment;

    public _roomId: string;
    private room: Room<any>;
    private chatRoom: Room<any>;
    private playerEntities: Player[] = [];
    private _currentPlayer;

    public _loadedAssets;

    constructor() {

    }

    async createScene(engine, client): Promise<void> {

        this._client = client;
        this._engine = engine;

        // create scene
        let scene = new Scene(engine);
        scene.shadowsEnabled = true;

        // black background
        scene.clearColor = new Color4(0, 0, 0, 1);

        // ambient light
        var ambientLight = new HemisphericLight(
            "light1",
            new Vector3(0, 1, 0),
            scene
        );
        ambientLight.intensity = 1.5;
        ambientLight.groundColor = new Color3(0.13, 0.13, 0.13);
        ambientLight.specular = Color3.Black();

        // shadow light
        var light = new DirectionalLight("DirectionalLight", new Vector3(-1, -1, -1), scene);
        light.position = new Vector3(1,1,1);
        light.intensity = 1; 

        // shadow generator
        this._shadow = new ShadowGenerator(512, light);
        this._shadow.bias = 0.001;
        this._shadow.normalBias = 0.02;
        this._shadow.useContactHardeningShadow = true;
        this._shadow.contactHardeningLightSizeUVRatio = 0.05;
        this._shadow.setDarkness(0.5);

        // set scene
        this._scene = scene;

        await this._initNetwork();

    }

    private async _initNetwork(): Promise<void> {

        try {

            let user = global.T5C.currentUser;
            let currentLocationKey = global.T5C.currentLocation.key;
            let room = await this._client.findCurrentRoom(currentLocationKey);

            if(room){

                // join game room
                this.room = await this._client.joinRoom(room.roomId, user);

                // join global chat room
                this.chatRoom = await this._client.joinChatRoom();
       
                // set global vars
                this._roomId = this.room.roomId;
                global.T5C.currentRoomID = this._roomId;
                global.T5C.currentSessionID = this.room.sessionId;

                await this._loadAssets();

            }else{

                console.error('FAILED TO CONNECT/CREATE ROOM');

            }

        } catch (e) {
            console.error("join error", e);
        }

    }

    
    private async _loadAssets(): Promise<void> {

        console.log(this._scene.metadata);

        // load environment
        // should load global.T5C.currentLocation GLB file only
        const environment = new Environment(this._scene);
        this._environment = environment;
        await this._environment.load(); //environment

        /*
        this._loadedAssets = [];
        var container = new AssetContainer(this._scene);
        this._assetsManager = new AssetsManager(this._scene);
        this._assetsManager.addContainerTask("player_mesh", "", "./models/", "player_fixed.glb");
        this._assetsManager.load();
        this._assetsManager.onFinish = function(meshes) {
           console.log('MESH LOADED', meshes);
           meshes.forEach((task: MeshAssetTask) => {
                console.log(task);
                this._loadedAssets.push({
                    "meshes": task.loadedMeshes[0]
                })
           });
          
        };*/

        await this._initEvents();
    }

    //load the character model
    private async _loadCharacterAssets(scene): Promise<any> {

        async function loadCharacter() {
            //collision mesh
            const outer = MeshBuilder.CreateBox("outer", { width: 2, depth: 1, height: 3 }, scene);
            outer.isVisible = false;
            outer.isPickable = false;
            outer.checkCollisions = true;

            //move origin of box collider to the bottom of the mesh (to match player mesh)
            outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0))
            //for collisions
            outer.ellipsoid = new Vector3(1, 1.5, 1);
            outer.ellipsoidOffset = new Vector3(0, 1.5, 0);

            outer.rotationQuaternion = new Quaternion(0, 1, 0, 0); // rotate the player mesh 180 since we want to see the back of the player

            //--IMPORTING MESH--
            return SceneLoader.ImportMeshAsync(null, "./models/", "player_fixed.glb", scene).then((result) => {
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
        }

        return loadCharacter().then(assets => {
            this._loadedAssets = assets;
        });
    }

    private async _initEvents() {

        await this._scene.whenReadyAsync();

        // setup player input
        // todo: probably should be in the player class
        this._input = new PlayerInput(this._scene);

        // setup hud
        this._ui = new Hud(this._scene, this._engine, this.room, this.chatRoom, this.playerEntities);

        // when someone joins the room event
        this.room.state.players.onAdd((entity, sessionId) => {

            var isCurrentPlayer = sessionId === this.room.sessionId;

            // create player entity
            let _player = new Player(entity, this.room, this._scene, this._ui, this._input, this._shadow);

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
            this.playerEntities[sessionId].characterLabel.dispose();
            this.playerEntities[sessionId].mesh.dispose();
            delete this.playerEntities[sessionId];
        });

        ///////////////
        // main game loop
        let timeThen = Date.now();
        let sequence = 0;
        let latestInput: PlayerInputs;
        this._scene.registerBeforeRender(() => {

            
            let timeNow = Date.now();
            let timePassed = (timeNow - timeThen) / 1000;
            let updateRate = Config.updateRate / 1000; // game is networked update every 100ms

            // continuously lerp movement at 60fps
            for (let sessionId in this.playerEntities) {
                const entity = this.playerEntities[sessionId];
                if(entity.mesh){
                    entity.mesh.position = Vector3.Lerp(entity.mesh.position, entity.playerNextPosition, 0.2);
                    entity.mesh.rotation = Vector3.Lerp(entity.mesh.rotation, entity.playerNextRotation, 0.8);
                }
            }

            // every 100ms loop
            if (timePassed >= updateRate) { 

                // detect movement
                if (this._input.left_click && (this._input.horizontal && this._input.vertical)) {

                    // increment seq
                    sequence++;

                    // prepare input to be sent
                    latestInput = {
                        seq: sequence,
                        h: this._input.horizontal,
                        v: this._input.vertical
                    }

                    // sent current input to server for processing
                    this.room.send("playerInput", latestInput);

                    // do client side prediction
                    this._currentPlayer.move(latestInput);

                    // Save this input for later reconciliation.
                    this._currentPlayer.playerInputs.push(latestInput);
                   
                }

                timeThen = timeNow;
            }


        })

    }

}