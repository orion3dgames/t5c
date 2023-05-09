import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { RadioGroup, SelectionPanel } from "@babylonjs/gui/2D/controls/";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

import { InputText } from "@babylonjs/gui/2D/controls/inputText";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";

import { SceneController } from "../Controllers/Scene";
import { AuthController } from "../Controllers/AuthController";
import State from "./Screens";
import { request, apiUrl, generateRandomPlayerName, isLocal } from "../../shared/Utils";
import { Environment } from "../Controllers/Environment";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { MeshAssetTask } from "@babylonjs/core/Misc/assetsManager";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { RacesDB } from "../../shared/Data/RacesDB";
import { dataDB } from "../../shared/Data/dataDB";

export class CharacterEditor {
    public _scene: Scene;
    private _auth: AuthController;
    public _environment;
    public _newState: State;
    public _button: Button;
    public _shadow: CascadedShadowGenerator;
    private _loadedAssets: MeshAssetTask[] = [];
    public results;
    public selection;
    public RACE;

    public _ui;
    public _uiRadioOptions;

    private _playerMesh;
    private _playerAnimations;

    constructor() {
        this._newState = State.NULL;
    }

    public async createScene(app) {
        // auth controller
        this._auth = AuthController.getInstance();

        let scene = new Scene(app.engine);
        scene.clearColor = new Color4(0, 0, 0, 1);

        // camera
        var camera = new ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 3, new Vector3(0, 0.8, 0), scene);
        camera.attachControl(app.canvas, true);
        camera.lowerRadiusLimit = 2;
        camera.upperRadiusLimit = 10;
        camera.wheelDeltaPercentage = 0.01;

        // scene light
        var sun = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
        sun.intensity = 0.6;
        sun.specular = Color3.Black();

        // shadow light
        var light = new DirectionalLight("DirectionalLight", new Vector3(-1, -2, -1), scene);
        light.position = new Vector3(100, 100, 100);
        light.radius = 0.27;
        light.intensity = 2;
        light.autoCalcShadowZBounds = true;

        // shadow generator
        this._shadow = new CascadedShadowGenerator(1024, light);
        this._shadow.filteringQuality = CascadedShadowGenerator.QUALITY_LOW;
        this._shadow.lambda = 0.94;
        this._shadow.bias = 0.018;
        this._shadow.autoCalcDepthBounds = true;
        this._shadow.shadowMaxZ = 1000;

        // add ground
        const ground = MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
        ground.receiveShadows = true;

        // load scene
        this._scene = scene;

        ///////////////////// END DEBUG CODE /////////////////////////////
        ///////////////////// DEBUG CODE /////////////////////////////////
        // if local skip login screen
        if (isLocal()) {
            // get random user
            let req = await request("get", apiUrl() + "/returnRandomUser");
            let character = JSON.parse(req.data).user;
            if (character) {
                // set user
                this._auth.setUser({
                    id: character.user_id,
                    username: character.username,
                    password: character.password,
                    token: character.token,
                });
                //set character
                this._auth.setCharacter(character);
            }
        }

        // check if user token is valid
        let user = await this._auth.loggedIn();
        if (!user) {
            // if token not valid, send back to login screen
            SceneController.goToScene(State.LOGIN);
        }
        ///////////////////// END DEBUG CODE /////////////////////////////
        ///////////////////// END DEBUG CODE /////////////////////////////

        /////////////////////////////////////////////////////////
        //////////////////////// UI
        /////////////////////////////////////////////////////////

        // set up ui
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this._ui = guiMenu;

        const usernameInput = new InputText("newCharacterInput");
        usernameInput.top = "-110px;";
        usernameInput.width = "200px";
        usernameInput.height = "30px;";
        usernameInput.color = "#FFF";
        usernameInput.text = generateRandomPlayerName();
        usernameInput.placeholderText = "Enter username";
        usernameInput.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        usernameInput.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(usernameInput);

        // PLAY BUTTON
        const playBtn = Button.CreateSimpleButton("playBtn", "PLAY");
        playBtn.top = "-70px";
        playBtn.width = "200px";
        playBtn.height = "30px";
        playBtn.color = "white";
        playBtn.background = "orange";
        playBtn.thickness = 1;
        playBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        playBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(playBtn);
        playBtn.onPointerDownObservable.add(() => {
            // create new character via database
            this.createCharacter(this._auth.currentUser.token, usernameInput.text).then((char) => {
                // login as this character
                this._auth.setCharacter(char);
                SceneController.goToScene(State.GAME);
                // reset text
                usernameInput.text = "";
            });
        });

        // BACK BUTTON
        const backBtn = Button.CreateSimpleButton("backBtn", "BACK");
        backBtn.top = "-30px";
        backBtn.width = "200px";
        backBtn.height = "30px";
        backBtn.color = "white";
        backBtn.background = "gray";
        backBtn.thickness = 1;
        backBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        backBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(backBtn);
        backBtn.onPointerDownObservable.add(() => {
            SceneController.goToScene(State.CHARACTER_SELECTION);
        });

        /////////////////////////////////////////////////////////
        //////////////////////// MESHES
        /////////////////////////////////////////////////////////

        // set default model
        let RACE = dataDB.get("race", "male_adventurer");
        this.RACE = RACE;

        // load assets and remove them all from scene
        const playerMesh = await SceneLoader.ImportMeshAsync("", "./models/races/", RACE.key + ".glb", scene);
        this._playerMesh = playerMesh;
        this._playerAnimations = playerMesh.animationGroups;

        // default animations
        this._playerAnimations[RACE.animations.IDLE].play(true);

        this.loadSelectionUI();
    }

    loadSelectionUI() {
        if (this._uiRadioOptions) {
            this._uiRadioOptions.dispose();
        }

        let meshAnimations = this.RACE.animations;
        const selectedAnimationGroups = [
            this._playerAnimations[meshAnimations.IDLE],
            this._playerAnimations[meshAnimations.WALK],
            this._playerAnimations[meshAnimations.DEATH],
        ];

        // show animations options
        var radioGroupAnim = new RadioGroup("Animation");
        selectedAnimationGroups.forEach((anim) => {
            radioGroupAnim.addRadio(anim.name, () => {
                selectedAnimationGroups.forEach((element) => {
                    element.stop();
                });
                anim.start(true, 1.0, anim.from, anim.to, false);
            });
        });

        var selectBox = new SelectionPanel("sp", [radioGroupAnim]);
        selectBox.background = "rgba(255, 255, 255, .7)";
        selectBox.top = "15px;";
        selectBox.left = "15px;";
        selectBox.width = 0.25;
        selectBox.height = 0.7;
        selectBox.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        selectBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._ui.addControl(selectBox);

        this._uiRadioOptions = selectBox;
    }

    hideAll(arr) {
        for (let key in arr) {
            let data = arr[key];
            data.forEach((b) => {
                this.showMesh(b, true);
            });
        }
    }

    showMesh(name: string, show = false) {
        let el = this._scene.getMeshByName(name);
        if (el) {
            el.isVisible = show;
        }
    }

    showMeshes(stringArray: string[] = [], show = true) {
        this.results.meshes.forEach((element) => {
            element.isVisible = false;
            if (stringArray.length > 0) {
                if (stringArray.includes(element.name)) {
                    element.isVisible = true;
                }
            }
        });
    }

    createStackPanel($name: string, ui, vertical = true) {
        const chatStackPanel = new StackPanel($name + "StackPanel");
        chatStackPanel.width = "100%";
        chatStackPanel.spacing = 5;
        chatStackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        chatStackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        chatStackPanel.adaptHeightToChildren = true;
        chatStackPanel.setPaddingInPixels(5, 0, 5, 0);
        chatStackPanel.isVertical = vertical;
        ui.addControl(chatStackPanel);
        return chatStackPanel;
    }

    createButton($name: string, ui, callback: any) {
        const btn = Button.CreateSimpleButton($name + "Btn", $name);
        btn.width = "100px;";
        btn.height = "22px";
        btn.color = "white";
        btn.background = "#222222";
        btn.thickness = 1;
        btn.fontSize = "12px";
        btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        ui.addControl(btn);
        btn.onPointerDownObservable.add(() => {
            callback(btn);
        });
    }

    ///////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////

    // create character
    async createCharacter(token, name) {
        // make sure both the username and password is entered.
        if (!name) {
            return false;
        }

        // check user exists else send back to login
        let req = await request("post", apiUrl() + "/create_character", {
            token: token,
            name: name,
        });

        // check req status
        if (req.status === 200) {
            return JSON.parse(req.data).character;
        } else {
            return false;
        }
    }
}
