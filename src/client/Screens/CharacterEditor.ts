import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { InputText } from "@babylonjs/gui/2D/controls/inputText";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import State from "./Screens";
import { generateRandomPlayerName } from "../../shared/Utils";
import { apiUrl } from "../Utils";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { GameController } from "../Controllers/GameController";
import axios from "axios";
import { Race } from "../../shared/types";
import { VatController } from "../Controllers/VatController";
import { Grid } from "@babylonjs/gui/2D/controls/grid";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";

export class CharacterEditor {
    public _game: GameController;
    public _scene: Scene;
    public _engine;
    public _environment;
    public _newState: State;
    public _button: Button;
    public _shadow: CascadedShadowGenerator;
    private _loadedAssets: AssetContainer[] = [];
    public _ui;

    private leftStackPanel: StackPanel;
    private rightStackPanel: StackPanel;

    private all_races: Race[] = [];

    private selected_mesh;
    private selected_animations;
    private selected_textures;

    private selected_race;
    private selected_face;
    private selected_variant;

    private btnsFace: any = [];
    private btnsColor: any = [];

    private randomPlayerName: string = "";

    private entityData;
    private entity: any = {
        race: "humanoid",
        head: "Head_Base",
        material: 1,
        raceData: {},
        mesh: null,
    };

    constructor() {
        this._newState = State.NULL;
    }

    public async createScene(game) {
        this._game = game;
        this._engine = game.engine;

        let scene = new Scene(game.engine);
        scene.clearColor = new Color4(0.1, 0.1, 0.1, 1);

        // load scene
        this._scene = scene;

        // camera
        var camera = new ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 2, 10, new Vector3(0, 1, 0), scene);
        camera.attachControl(game.canvas, true);
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
        const ground = MeshBuilder.CreateCylinder("ground", { diameter: 3, height: 0.1 }, scene);
        ground.position.y -= 0.1;
        ground.receiveShadows = true;

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

        // hide loading gui
        this._game.engine.hideLoadingUI();

        /////////////////////////////////////////////////////////
        //////////////////////// UI
        /////////////////////////////////////////////////////////

        // set up ui
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this._ui = guiMenu;

        // left columm
        const leftColumnRect = new Rectangle("columnLeft");
        leftColumnRect.top = 0;
        leftColumnRect.left = "0";
        leftColumnRect.width = 0.2;
        leftColumnRect.height = 1;
        leftColumnRect.background = "#000000";
        leftColumnRect.thickness = 0;
        leftColumnRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        leftColumnRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        guiMenu.addControl(leftColumnRect);

        const leftStackPanel = new StackPanel("leftStackPanel");
        leftStackPanel.top = 0;
        leftStackPanel.width = 0.8;
        leftStackPanel.height = 0.6;
        leftStackPanel.background = "";
        leftStackPanel.spacing = 5;
        leftStackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        leftStackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        leftStackPanel.adaptHeightToChildren = true;
        leftStackPanel.setPaddingInPixels(5, 5, 5, 5);
        leftStackPanel.isVertical = true;
        leftColumnRect.addControl(leftStackPanel);
        this.leftStackPanel = leftStackPanel;

        /////////////////////////////////////////
        // right columm
        const rightColumnRect = new Rectangle("rightColumnRect");
        rightColumnRect.top = 0;
        rightColumnRect.left = 0;
        rightColumnRect.width = 0.2;
        rightColumnRect.height = 1;
        rightColumnRect.background = "#000000";
        rightColumnRect.thickness = 0;
        rightColumnRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        rightColumnRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        guiMenu.addControl(rightColumnRect);

        const rightStackPanel = new StackPanel("rightStackPanel");
        rightStackPanel.top = 0;
        rightStackPanel.width = 0.8;
        rightStackPanel.height = 1;
        rightStackPanel.background = "";
        rightStackPanel.spacing = 5;
        rightStackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        rightStackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        rightStackPanel.adaptHeightToChildren = true;
        rightStackPanel.setPaddingInPixels(5, 5, 5, 5);
        rightStackPanel.isVertical = true;
        rightColumnRect.addControl(rightStackPanel);
        this.rightStackPanel = rightStackPanel;

        /////////////////////////////////////////////////////////
        //////////////////////// MESHES
        /////////////////////////////////////////////////////////

        let choices = ["humanoid"];
        let races = this._game.loadGameData("races");

        for (let race in races) {
            if (choices.includes(race)) {
                this.all_races[race] = races[race];
            }
        }

        let defaultRace = choices[Math.floor(Math.random() * choices.length)];
        let defaultVariant = races[defaultRace].materials[Math.floor(Math.random() * races[defaultRace].materials.length)];

        this.selected_race = races[defaultRace];
        this.selected_face = this.selected_race.vat.meshes.HEAD[0];
        this.selected_variant = defaultVariant;

        //
        this.randomPlayerName = generateRandomPlayerName();

        // initialize assets controller
        this._game.initializeAssetController();
        await this._game._assetsCtrl.loadRaces();

        this._game._vatController = new VatController(this._game, []);
        await this._game._vatController.initialize();
        console.log("[VAT] fully loaded", this._game._vatController._entityData);

        // load character
        await this.initialize(this.selected_race);
    }

    cleanup(previousChoice) {
        previousChoice.materials.forEach((element) => {
            let material = this._scene.getMaterialByName(previousChoice.key) as PBRMaterial;
            if (material) {
                if (material.albedoTexture) {
                    material.albedoTexture.dispose();
                }
                material.dispose();
            }
        });
    }

    async initialize(race) {
        if (this.selected_mesh) {
            this.selected_mesh.dispose();
        }
        if (this.selected_animations) {
            this.selected_animations.forEach((element) => {
                element.dispose();
            });
        }

        this.entity.raceData = race;
        this.entityData = this._game._vatController._entityData.get(race.key);

        await this.loadCharacter(race);

        // create ui
        this.refreshUI();

        this._scene.registerBeforeRender(() => {
            // get current delta
            let delta = this._game.engine.getFps();

            // process vat animations
            this._game._vatController.process(delta);
        });
    }

    async loadCharacter(choice) {
        if (this.entity.mesh) {
            this.entity.mesh.dispose();
        }

        this._game._vatController.prepareMesh(this.entity);

        let animIndex = 4;
        let idle = {
            name: "IDLE",
            index: animIndex,
            loop: true,
            speed: 1,
            ranges: this.entityData.animationRanges[animIndex],
        };

        setTimeout(() => {
            let materialIndex = VatController.findMeshKey(this.entity.raceData, this.entity);
            const playerMesh = this.entityData.meshes.get(materialIndex).createInstance("CHARACTER");
            this.entity.mesh = playerMesh;
            this.setAnimationParameters(playerMesh.instancedBuffers.bakedVertexAnimationSettingsInstanced, idle);
        }, 400);
    }

    disposeUI() {
        // if already exists
        this.leftStackPanel.getDescendants().forEach((el) => {
            el.dispose();
        });
        this.rightStackPanel.getDescendants().forEach((el) => {
            el.dispose();
        });
    }

    refreshUI() {
        this.loadCenterPanel();

        // remove previous ui elements
        this.disposeUI();

        // create race section
        this.sectionRace();

        // if race selected
        if (this.selected_race) {
            // create race description
            //this.sectionDescription();

            this.sectionFaces();

            // create race variants
            this.sectionVariant();
        }
    }

    sectionRace() {
        const sectionTitle = new TextBlock("sectionTitle", "Choose Class");
        sectionTitle.width = 0.8;
        sectionTitle.height = "40px";
        sectionTitle.color = "white";
        sectionTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        sectionTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        sectionTitle.fontWeight = "bold";
        this.leftStackPanel.addControl(sectionTitle);

        for (let raceKey in this.all_races) {
            let choice = this.all_races[raceKey];

            const btnChoice = Button.CreateSimpleButton("btnChoice", choice.title);
            btnChoice.top = "0px";
            btnChoice.width = 1;
            btnChoice.height = "30px";
            btnChoice.color = "white";
            btnChoice.background = "gray";
            btnChoice.thickness = 1;
            btnChoice.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            btnChoice.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.leftStackPanel.addControl(btnChoice);

            if (this.selected_race && this.selected_race.title === choice.title) {
                btnChoice.background = "green";
            }

            btnChoice.onPointerDownObservable.add(() => {
                this.cleanup(this.selected_race);
                this.selected_race = choice;
                this.selected_variant = choice.materials[0];
                this.loadCharacter(choice);
            });
        }
    }

    sectionFaces() {
        let selectedChoices = this.selected_race.vat.meshes.HEAD;

        const sectionTitle = new TextBlock("sectionTitle", "Choose Face");
        sectionTitle.width = 0.8;
        sectionTitle.height = "40px";
        sectionTitle.color = "white";
        sectionTitle.top = "100px";
        sectionTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        sectionTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.leftStackPanel.addControl(sectionTitle);

        // add scrollable container
        const chatScrollViewer = new ScrollViewer("chatScrollViewer");
        chatScrollViewer.width = 1;
        chatScrollViewer.height = "150px;";
        chatScrollViewer.thickness = 1;
        this.leftStackPanel.addControl(chatScrollViewer);

        const chatStackPanel = new StackPanel("chatStackPanel");
        chatStackPanel.width = "100%";
        chatStackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        chatStackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        chatStackPanel.paddingTop = "5px;";
        chatScrollViewer.addControl(chatStackPanel);

        selectedChoices.forEach((faceKey) => {
            const btnChoice = Button.CreateSimpleButton("btnChoice", faceKey);
            btnChoice.top = "0px";
            btnChoice.width = 1;
            btnChoice.height = "30px";
            btnChoice.color = "white";
            btnChoice.background = "gray";
            btnChoice.thickness = 1;
            btnChoice.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            btnChoice.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            chatStackPanel.addControl(btnChoice);

            this.btnsFace.push(btnChoice);

            if (this.entity.head === faceKey) {
                btnChoice.background = "green";
            }

            btnChoice.onPointerDownObservable.add(() => {
                this.entity.head = faceKey;
                this.loadCharacter(this.selected_race);
                this.resetButtons(this.btnsFace);
                btnChoice.background = "green";
            });
        });
    }

    sectionVariant() {
        let selectedChoices = this.selected_race.materials;

        const sectionTitle = new TextBlock("sectionTitle", "Choose Color");
        sectionTitle.width = 0.8;
        sectionTitle.height = "40px";
        sectionTitle.color = "white";
        sectionTitle.top = "100px";
        sectionTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        sectionTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.leftStackPanel.addControl(sectionTitle);

        // add scrollable container
        const chatScrollViewer = new ScrollViewer("chatScrollViewer");
        chatScrollViewer.width = 1;
        chatScrollViewer.height = "150px;";
        chatScrollViewer.thickness = 1;
        this.leftStackPanel.addControl(chatScrollViewer);

        const chatStackPanel = new StackPanel("chatStackPanel");
        chatStackPanel.width = "100%";
        chatStackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        chatStackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        chatStackPanel.paddingTop = "5px;";
        chatScrollViewer.addControl(chatStackPanel);

        selectedChoices.forEach((mat, index) => {
            const btnChoice = Button.CreateSimpleButton("btnChoice_" + index, mat.material);
            btnChoice.top = "0px";
            btnChoice.width = 1;
            btnChoice.height = "30px";
            btnChoice.color = "white";
            btnChoice.background = "gray";
            btnChoice.thickness = 1;
            btnChoice.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            btnChoice.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            chatStackPanel.addControl(btnChoice);

            this.btnsColor.push(btnChoice);

            if (this.entity.material === index) {
                btnChoice.background = "green";
            }

            btnChoice.onPointerDownObservable.add(() => {
                this.entity.material = index;
                this.loadCharacter(this.selected_race);
                this.resetButtons(this.btnsColor);
                btnChoice.background = "green";
            });
        });
    }

    resetButtons(btns) {
        btns.forEach((btnChoice) => {
            btnChoice.background = "gray";
        });
    }

    loadCenterPanel() {
        ////////////////////////////////////////////////
        // center columm
        const centerColumnRect = new Rectangle("centerColumnRect");
        centerColumnRect.top = "0px;";
        centerColumnRect.left = 0;
        centerColumnRect.width = "300px";
        centerColumnRect.height = "200px";
        centerColumnRect.thickness = 0;
        centerColumnRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        centerColumnRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._ui.addControl(centerColumnRect);

        ////////////////////////////////////////
        const usernameInput = new InputText("newCharacterInput");
        usernameInput.top = "-110px;";
        usernameInput.width = "200px";
        usernameInput.height = "30px;";
        usernameInput.color = "#FFF";
        usernameInput.text = this.randomPlayerName;
        usernameInput.placeholderText = "Enter username";
        usernameInput.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        usernameInput.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        centerColumnRect.addControl(usernameInput);

        // PLAY BUTTON
        const playBtn = Button.CreateSimpleButton("playBtn", "Create");
        playBtn.top = "-70px";
        playBtn.width = "200px";
        playBtn.height = "30px";
        playBtn.color = "white";
        playBtn.background = "orange";
        playBtn.thickness = 1;
        playBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        playBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        centerColumnRect.addControl(playBtn);
        playBtn.onPointerDownObservable.add(() => {
            // create new character via database
            this.createCharacter(this._game.currentUser.token, usernameInput.text).then((char) => {
                // login as this character
                this._game.setCharacter(char);
                this._game.setScene(State.CHARACTER_SELECTION);
                // reset text
                usernameInput.text = "";
            });
        });

        // BACK BUTTON
        const backBtn = Button.CreateSimpleButton("backBtn", "CANCEL");
        backBtn.top = "-30px";
        backBtn.width = "200px";
        backBtn.height = "30px";
        backBtn.color = "white";
        backBtn.background = "gray";
        backBtn.thickness = 1;
        backBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        backBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        centerColumnRect.addControl(backBtn);
        backBtn.onPointerDownObservable.add(() => {
            this._game.setScene(State.CHARACTER_SELECTION);
        });
    }

    private setAnimationParameters(vec, currentAnim, delta = 60) {
        const animIndex = currentAnim.index ?? 0;
        const anim = this.entityData.animationRanges[animIndex];

        const from = Math.floor(anim.from);
        const to = Math.floor(anim.to);

        vec.set(from, to - 1, 0, delta); // skip one frame to avoid weird artifacts
    }

    /*
    sectionDescription() {
        const section3Title = new TextBlock("section3Title", "Class Description");
        section3Title.width = 0.8;
        section3Title.height = "60px";
        section3Title.color = "white";
        section3Title.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        section3Title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        section3Title.fontWeight = "bold";
        this.rightStackPanel.addControl(section3Title);

        const section3Description = new TextBlock("section3Description", this.selected_race.description);
        section3Description.width = 0.8;
        section3Description.height = "100px";
        section3Description.color = "white";
        section3Description.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        section3Description.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        section3Description.fontSize = "16px";
        section3Description.textWrapping = TextWrapping.WordWrap;
        section3Description.resizeToFit = true;
        this.rightStackPanel.addControl(section3Description);
    }*/

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
        const req = await axios.request({
            method: "POST",
            params: {
                token: token,
                name: name,
                race: this.entity.race,
                material: this.entity.material,
                head: this.entity.head,
            },
            url: apiUrl(this._game.config.port) + "/create_character",
        });

        // check req status
        if (req.status === 200) {
            return req.data.character;
        } else {
            return false;
        }
    }
}
