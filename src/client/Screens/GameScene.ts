import { Engine } from "@babylonjs/core/Engines/engine";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { Scene } from "@babylonjs/core/scene";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

import State from "./Screens";
import { PlayerInput } from "../Controllers/PlayerInput";
import { Environment } from "../Controllers/Environment";
import { UserInterface } from "../Controllers/UserInterface";
import { Player } from "../../shared/Entities/Player";
import { Entity } from "../../shared/Entities/Entity";
import Config from '../../shared/Config';
import { Room } from "colyseus.js";
import { PlayerInputs } from "../../shared/types";
import { apiUrl, isLocal, request } from "../../shared/Utils";
import { NavMesh } from "../../shared/yuka";
import loadNavMeshFromString from "../../shared/Utils/loadNavMeshFromString";

import { createConvexRegionHelper, createGraphHelper } from "../../shared/Utils/navMeshHelper";
import Locations from "../../shared/Data/Locations";

export class GameScene {

    private _scene: Scene;
    private _client;
    private _engine: Engine;
    private _assetsContainer: AssetContainer[] = [];
    private _input: PlayerInput;
    private _ui;
    private _shadow: CascadedShadowGenerator;
    private _environment: Environment;
    private _navMesh:NavMesh;

    private _roomId: string;
    private room: Room<any>;
    private chatRoom: Room<any>;
    private _currentPlayer:Player;
    private _loadedAssets;

    // networked entities
    private entities: Entity[] = [];
    private players: Player[] = [];
    

    constructor() {

    }

    async createScene(engine, client): Promise<void> {

        this._client = client;
        this._engine = engine;

        // create scene
        let scene = new Scene(engine);

        // set scene
        this._scene = scene;

        // load assets and remove them all from scene
        await this._loadAssets();

        ///////////////////// END DEBUG CODE /////////////////////////////
        ///////////////////// DEBUG CODE /////////////////////////////////
        // if local skip login screen
        if(isLocal()){
            //let tempLocation = "lh_town";
            let tempLocation = "lh_town";
            global.T5C.currentLocation = Locations[tempLocation];
            let req = await request('get', apiUrl()+'/returnRandomUser');
            let character = JSON.parse(req.data).user;
            global.T5C.currentUser = {
                id: character.user_id,
                username: character.username,
                password: character.password,
                token: character.token,
            }
            global.T5C.currentCharacter = character;
            global.T5C.currentCharacter.location = tempLocation;
        }
        ///////////////////// END DEBUG CODE /////////////////////////////
        ///////////////////// END DEBUG CODE /////////////////////////////

        //
        let location = global.T5C.currentLocation;
        console.log(location);

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
        light.autoCalcShadowZBounds = true;

        // shadow generator
        this._shadow = new CascadedShadowGenerator(2048, light);
        this._shadow.filteringQuality = CascadedShadowGenerator.QUALITY_MEDIUM;
        this._shadow.bias = 0.018;
        this._shadow.autoCalcDepthBounds = true;
        this._shadow.shadowMaxZ = 95;

        await this._initNetwork();
    }

    private async _loadAssets() {

        this._assetsContainer['player_hobbit'] = await SceneLoader.LoadAssetContainerAsync("./models/", "player_hobbit.glb", this._scene);
        this._assetsContainer['monster_unicorn'] = await SceneLoader.LoadAssetContainerAsync("./models/", "monster_unicorn.glb", this._scene);
        this._assetsContainer['monster_bear'] = await SceneLoader.LoadAssetContainerAsync("./models/", "monster_bear.glb", this._scene);
        
        // create materials
        var material = new StandardMaterial('debug_entity_neutral');
        material.alpha = .5;
        material.diffuseColor = new Color3(1.0, 1.0, 1.0);

        var material = new StandardMaterial('debug_entity_active');
        material.alpha = .5;
        material.diffuseColor = new Color3(1.0, 0, 0);

        var texture = new Texture("./images/selected_circle_green.png");
        texture.hasAlpha = true;
        var material = new StandardMaterial('entity_selected');
        material.diffuseTexture = texture;
        material.useAlphaFromDiffuseTexture = true;
    }

    private async _initNetwork(): Promise<void> {

        try {

            let user = global.T5C.currentUser;
            let character = global.T5C.currentCharacter;
            let currentLocationKey = character.location;
            let room = await this._client.findCurrentRoom(currentLocationKey);

            if(room){

                // join game room
                this.room = await this._client.joinRoom(room.roomId, user.token, character.id);

                // join global chat room (match sessionId to gameRoom)
                this.chatRoom = await this._client.joinChatRoom({sessionId: this.room.sessionId});
       
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
        this._navMesh = await loadNavMeshFromString(global.T5C.currentLocation.key);
        console.log('NAVMESH LOADED', this._navMesh);

        // visualize navmesh
        //let navMeshGroup = createConvexRegionHelper(this._navMesh, this._scene)
        //let graphHelper = createGraphHelper(this._scene, this._navMesh.graph, 0.2)

        await this._initEvents();
    }

    private async _initEvents() {

        await this._scene.whenReadyAsync();

        // setup input Controller
        this._input = new PlayerInput(this._scene, this.room);

        // setup hud
        this._ui = new UserInterface(this._scene, this._engine, this.room, this.chatRoom, this.entities, this._currentPlayer);

        ////////////////////////////////////////////////////
        //  when a entity joins the room event
        this.room.state.players.onAdd((entity, sessionId) => {
            
            var isCurrentPlayer = sessionId === this.room.sessionId;

            //////////////////
            // if player type
            if(entity.type === 'player' && isCurrentPlayer){

                // create player entity
                let _player = new Player(entity, this.room, this._scene, this._ui, this._shadow, this._navMesh, this._assetsContainer, this._input);
           
                // set currentPlayer
                this._currentPlayer = _player;

                // add player specific  ui
                this._ui.setCurrentPlayer(_player);

                // add to entities
                this.players[sessionId] = _player;

            //////////////////
            // else if entity or another player
            }else{

                // save entity
                this.entities[sessionId] = new Entity(entity, this.room, this._scene, this._ui, this._shadow, this._navMesh, this._assetsContainer);
            }
            
        });

        this.room.state.entities.onAdd((entity, sessionId) => {
            this.entities[sessionId] = new Entity(entity, this.room, this._scene, this._ui, this._shadow, this._navMesh, this._assetsContainer);
        });

        // when a player leaves the room event
        this.room.state.players.onRemove((player, sessionId) => {
            if(this.players[sessionId]){
                this.players[sessionId].remove();
                delete this.players[sessionId];
            }else{
                this.entities[sessionId].remove();
                delete this.entities[sessionId];
            }
        });
        // when a player leaves the room event
        this.room.state.entities.onRemove((player, sessionId) => {
            this.entities[sessionId].remove();
            delete this.entities[sessionId];
        });
        ////////////////////////////////////////////////////

        ////////////////////////////////////////////////////
        // main game loop
        let timeThen = Date.now();
        let sequence = 0;
        let latestInput: PlayerInputs;
        this._scene.registerBeforeRender(() => {

            /*
            if(this._environment.allMeshes){
                for(let meshId in this._environment.allMeshes){
                    const mesh = this._environment.allMeshes[meshId];
                    mesh.setEnabled(false); 
                    let entityPos = mesh.position;
                    let playerPos = this._currentPlayer.position();
                    let distanceFromPlayer = Vector3.Distance(playerPos, entityPos);
                    if(distanceFromPlayer < Config.PLAYER_VIEW_DISTANCE){
                        mesh.setEnabled(true); 
                    }
                }
            }*/

            // continuously move entities at 60fps
            for (let sessionId in this.entities) {
                const entity = this.entities[sessionId];
                entity.update();
                entity.lod(this._currentPlayer);
            }

            for (let sessionId in this.players) {
                const entity = this.players[sessionId];
                entity.update();
            }

            // every 100ms loop
            let timeNow = Date.now();
            let timePassed = (timeNow - timeThen) / 1000;
            let updateRate = Config.updateRate / 1000; // game is networked update every 100ms
            if (timePassed >= updateRate) { 

                // detect movement
                if (this._input.player_can_move && 
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