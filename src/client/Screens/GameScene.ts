import {
    Scene, Engine, Vector3, Color3, Color4,
    ShadowGenerator, CascadedShadowGenerator,
    DirectionalLight, HemisphericLight,
    AssetsManager, AssetContainer,
} from "@babylonjs/core";

import { AdvancedDynamicTexture } from "@babylonjs/gui";
import State from "./Screens";
import { Input } from "../Controllers/Input";
import { Environment } from "../Controllers/Environment";
import { UserInterface } from "../Controllers/UserInterface";
import { Player } from "../../shared/Entities/Player";
import Config from '../../shared/Config';
import { Room } from "colyseus.js";
import { PlayerInputs } from "../../shared/types";
import { apiUrl, isLocal, request } from "../../shared/Utils";
import loadNavMeshFromString from "../../shared/Utils/loadNavMeshFromString";

export class GameScene {

    public _scene: Scene;
    public _client;
    private _engine: Engine;
    private _gui: AdvancedDynamicTexture;
    private _assetsManager: AssetsManager;
    public assetsContainer: AssetContainer;
    private _input;
    private _ui;
    private _shadow: CascadedShadowGenerator;
    private _environment: Environment;
    private _navMesh;

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

        // set scene
        this._scene = scene;

        let location = global.T5C.currentLocation;

        // black background
        scene.clearColor = new Color4(0, 0, 0, 1);

        if(location.sun){
            // ambient light
            var ambientLight = new HemisphericLight(
                "light1",
                new Vector3(0, 1, 0),
                scene
            );
            ambientLight.intensity = 1;
            ambientLight.groundColor = new Color3(0.13, 0.13, 0.13);
            ambientLight.specular = Color3.Black();
        }

        // shadow light
        var light = new DirectionalLight("DirectionalLight", new Vector3(-1, -2, -1), scene);
        light.position = new Vector3(100,100,100);
        light.radius = 0.27;
        light.intensity = location.sunIntensity;

        // shadow generator
        this._shadow = new CascadedShadowGenerator(1024, light);
        this._shadow.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
        this._shadow.bias = 0.018;

        // load assets
        //this._loadedAssets = await this._loadAssets();

        await this._initNetwork();
    }

    private async _loadAssets(): Promise<any[ ]> {
        return new Promise( resolve => {
            this._assetsManager = new AssetsManager(this._scene);
            this._assetsManager.addMeshTask("town", "", "./models/", global.T5C.currentLocationKey+".glb");
            this._assetsManager.addMeshTask("player_mesh_1", "", "./models/", "player_hobbit.glb");
            this._assetsManager.load();
            this._assetsManager.onProgress = function(remainingCount, totalCount, lastFinishedTask) {
                console.log('We are loading the scene. ' + remainingCount + ' out of ' + totalCount + ' items still need to be loaded.');
            };
            this._assetsManager.onFinish = function(assets) {
                console.log('all meshes are now loaded...', assets);
                let meshes = [];
                assets.forEach((el)=>{
                    meshes[el.name] = el;
                })
                resolve(meshes);
            };
        });
    }

    private async _initNetwork(): Promise<void> {

        try {

            if(isLocal()){
                global.T5C.currentUser = {
                    id: 2,
                    username: 'Code_Code',
                    password: 'test',
                    token: 'E3Hcyxx6QCiHWpcMukff8',
                }
                global.T5C.currentCharacter = {
                    id: 1,
                    user_id: 2,
                    name: "Test",
                    location: 'lh_town',
                    x: 0,
                    y: 0,
                    z: 0,
                    rot: 0
                };
            }

            let user = global.T5C.currentUser;
            let character = global.T5C.currentCharacter;
            let currentLocationKey = global.T5C.currentLocation.key;
            let room = await this._client.findCurrentRoom(currentLocationKey);

            if(room){

                // join game room
                this.room = await this._client.joinRoom(room.roomId, user.token, character.id);

                // join global chat room
                this.chatRoom = await this._client.joinChatRoom();
       
                // set global vars
                this._roomId = this.room.roomId;
                global.T5C.currentRoomID = this._roomId;
                global.T5C.currentSessionID = this.room.sessionId;


                await this._loadEnvironment();

            }else{

                console.error('FAILED TO CONNECT/CREATE ROOM');

            }

        } catch (e) {

            console.error('FAILED TO CONNECT/CREATE ROOM', e);
            alert('Failed to connect.');

            Config.goToScene(State.CHARACTER_SELECTION);
            
        }

    }

    private async _loadEnvironment(): Promise<void> {
        
        // load environment
        const environment = new Environment(this._scene, this._shadow);
        this._environment = environment;
        await this._environment.load(this._loadedAssets); //environment

        // load navmesh
        let req = await request('get', '/models/'+global.T5C.currentLocation.key+'.obj');
        this._navMesh = await loadNavMeshFromString(req.data);

        await this._initEvents();
    }

    private async _initEvents() {

        await this._scene.whenReadyAsync();

        // setup input Controller
        this._input = new Input(this._scene);

        // setup hud
        this._ui = new UserInterface(this._scene, this._engine, this.room, this.chatRoom, this.playerEntities);

        // when someone joins the room event
        this.room.state.players.onAdd((entity, sessionId) => {

            var isCurrentPlayer = sessionId === this.room.sessionId;

            // create player entity
            let _player = new Player(entity, this.room, this._scene, this._ui, this._input, this._shadow, this._navMesh);
            

            // if current player, save entity ref
            if (isCurrentPlayer) {
                // set currentPlayer
                this._currentPlayer = _player;

                
            }

            // save entity
            this.playerEntities[sessionId] = _player;

        });

        // when someone leave the room event
        this.room.state.players.onRemove((player, sessionId) => {
            this.playerEntities[sessionId].removePlayer();
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
                const player = this.playerEntities[sessionId];
                player.moveController.tween();
            }

            // every 100ms loop
            if (timePassed >= updateRate) { 

                // detect movement
                if (this._input.left_click && 
                    (this._input.horizontal && this._input.vertical) && 
                    !this._currentPlayer.blocked
                    ) {

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
                    this._currentPlayer.moveController.predictionMove(latestInput);
                   
                }

                timeThen = timeNow;
            }


        })

    }

}