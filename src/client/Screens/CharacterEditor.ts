import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { InputText } from "@babylonjs/gui/2D/controls/inputText";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ContainerAssetTask, MeshAssetTask } from "@babylonjs/core/Misc/assetsManager";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

import { Environment } from "../Controllers/Environment";
import { SceneController } from "../Controllers/Scene";
import { AuthController } from "../Controllers/AuthController";
import State from "./Screens";
import { request, apiUrl, generateRandomPlayerName } from "../../shared/Utils";
import { dataDB } from "../../shared/Data/dataDB";
import { FollowCamera } from "@babylonjs/core/Cameras/followCamera";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { reloadFromCache } from "@colyseus/core/build/utils/DevMode";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";

export class CharacterEditor {
    public _scene: Scene;
    private _auth: AuthController;
    public _environment;
    public _newState: State;
    public _button: Button;
    public _shadow: CascadedShadowGenerator;
    private _loadedAssets: AssetContainer[] = [];
    public _ui;

    private stackPanel: StackPanel;
    private selected_mesh;
    private selected_animations;
    private selected_textures;
    private selected_class;
    private selected_variant;

    private section1;
    private section2;

    constructor() {
        this._newState = State.NULL;
    }

    public async createScene(app) {
        // auth controller
        this._auth = AuthController.getInstance();

        let scene = new Scene(app.engine);
        scene.clearColor = new Color4(0.1, 0.1, 0.1, 1);

        // camera
        var camera = new ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 2, 10, new Vector3(0, 1, 0), scene);
        camera.attachControl(app.canvas, true);
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

        // load scene
        this._scene = scene;

        // if no user logged in, force a auto login
        // to be remove later or
        if (!this._auth.currentUser) {
            await this._auth.forceLogin();
        }

        // check if user token is valid
        let user = await this._auth.loggedIn();
        if (!user) {
            // if token not valid, send back to login screen
            SceneController.goToScene(State.LOGIN);
        }

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

        // right columm
        const rightColumnRect = new Rectangle("rightColumnRect");
        rightColumnRect.top = 0;
        rightColumnRect.left = 0;
        rightColumnRect.width = 0.8;
        rightColumnRect.height = 1;
        rightColumnRect.background = "rgba(0,0,0,0)";
        rightColumnRect.thickness = 0;
        rightColumnRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        rightColumnRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        guiMenu.addControl(rightColumnRect);

        // logo
        var imgLogo = new Image("imgLogo", "./images/logo.png");
        imgLogo.stretch = Image.STRETCH_UNIFORM;
        imgLogo.top = "30px";
        imgLogo.width = 1;
        imgLogo.height = "65px;";
        imgLogo.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        leftColumnRect.addControl(imgLogo);

        // welcome text
        const welcomeText = new TextBlock("infotext", "Welcome " + user.username);
        welcomeText.width = 0.8;
        welcomeText.height = "40px";
        welcomeText.color = "white";
        welcomeText.top = "100px";
        welcomeText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        welcomeText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        leftColumnRect.addControl(welcomeText);

        const sectionStackPanel = new StackPanel("sectionStackPanel");
        sectionStackPanel.top = "160px";
        sectionStackPanel.width = 0.8;
        sectionStackPanel.height = 0.6;
        sectionStackPanel.background = "";
        sectionStackPanel.spacing = 5;
        sectionStackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        sectionStackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        sectionStackPanel.adaptHeightToChildren = true;
        sectionStackPanel.setPaddingInPixels(5, 5, 5, 5);
        sectionStackPanel.isVertical = true;
        leftColumnRect.addControl(sectionStackPanel);
        this.stackPanel = sectionStackPanel;

        ////////////////////////////////////////
        const usernameInput = new InputText("newCharacterInput");
        usernameInput.top = "-110px;";
        usernameInput.width = "200px";
        usernameInput.height = "30px;";
        usernameInput.color = "#FFF";
        usernameInput.text = generateRandomPlayerName();
        usernameInput.placeholderText = "Enter username";
        usernameInput.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        usernameInput.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        rightColumnRect.addControl(usernameInput);

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
        rightColumnRect.addControl(playBtn);
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
        rightColumnRect.addControl(backBtn);
        backBtn.onPointerDownObservable.add(() => {
            SceneController.goToScene(State.CHARACTER_SELECTION);
        });

        /////////////////////////////////////////////////////////
        //////////////////////// MESHES
        /////////////////////////////////////////////////////////

        this._environment = new Environment(this._scene, this._shadow, this._loadedAssets);
        await this._environment.loadCharacterEditor();

        //
        this.section1 = {
            title: "Choose Class",
            choices: [
                {
                    title: "Knight",
                    description: "The knight is as knight should be, strong and righteous. It has a large health pool and uses stamina to cast its abilities.",
                    mesh: "male_knight",
                    material: "male_knight",
                },
                {
                    title: "Mage",
                    description:
                        "The mage is a powerful class, but has a small health pool. It uses mana to cast spells, and should use its spells carefully if it does not want to run out of mana.",
                    mesh: "male_mage",
                    material: "male_mage",
                },
            ],
        };

        this.section2 = {
            title: "Choose Color",
            choices: {
                male_knight: [
                    { title: "Color 1", material: "knight_texture.png" },
                    { title: "Color 2", material: "knight_texture_alt_A.png" },
                    { title: "Color 3", material: "knight_texture_alt_B.png" },
                    { title: "Color 4", material: "knight_texture_alt_C.png" },
                ],
                male_mage: [
                    { title: "Color 1", material: "mage_texture.png" },
                    { title: "Color 2", material: "mage_texture_alt_A.png" },
                    { title: "Color 3", material: "mage_texture_alt_B.png" },
                    { title: "Color 4", material: "mage_texture_alt_C.png" },
                ],
            },
        };

        this.selected_class = this.section1.choices[0];
        this.selected_variant = this.section2.choices[this.selected_class.mesh][0];
        this.loadCharacter(this.selected_class);
    }

    loadCharacter(choice) {
        /*
        if (this.selected_mesh && this.selected_mesh._children[0]._children.length > 0) {
            this.selected_mesh._children[0]._children.forEach((element) => {
                if (element.material) {
                    console.log(element.material);

                    element.material.albedoTexture.dispose();
                    element.material.dispose();
                }
            });
        }*/
        let material = this._scene.getMaterialByName(choice.material) as PBRMaterial;
        if (material) {
            if (material.albedoTexture) {
                material.albedoTexture.dispose();
            }
            material.dispose();
        }

        if (this.selected_mesh) {
            this.selected_mesh.dispose();
        }
        if (this.selected_animations) {
            this.selected_animations.forEach((element) => {
                element.dispose();
            });
        }

        const result = this._loadedAssets[choice.mesh].instantiateModelsToScene(
            () => {
                return choice.mesh;
            },
            true,
            { doNotInstantiate: false }
        );
        this.selected_mesh = result.rootNodes[0];
        this.selected_animations = result.animationGroups;

        console.log(this.selected_mesh);

        this._shadow.addShadowCaster(this.selected_mesh, true);

        this.selected_animations[36].play(true);

        this.refreshUI();
    }

    refreshUI() {
        // if already exists
        this.stackPanel.getDescendants().forEach((el) => {
            el.dispose();
        });

        /////////////////////////// SECTION 1 ///////////////////

        const sectionTitle = new TextBlock("sectionTitle", this.section1.title);
        sectionTitle.width = 0.8;
        sectionTitle.height = "40px";
        sectionTitle.color = "white";
        sectionTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        sectionTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        sectionTitle.fontWeight = "bold";
        this.stackPanel.addControl(sectionTitle);

        this.section1.choices.forEach((choice) => {
            const btnChoice = Button.CreateSimpleButton("btnChoice", choice.title);
            btnChoice.top = "0px";
            btnChoice.width = 1;
            btnChoice.height = "30px";
            btnChoice.color = "white";
            btnChoice.background = "gray";
            btnChoice.thickness = 1;
            btnChoice.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            btnChoice.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.stackPanel.addControl(btnChoice);

            if (this.selected_class && this.selected_class.title === choice.title) {
                btnChoice.background = "green";
            }

            btnChoice.onPointerDownObservable.add(() => {
                this.selected_class = choice;
                this.selected_variant = this.section2.choices[this.selected_class.mesh][0];
                this.loadCharacter(choice);
            });
        });

        /////////////////////////// SECTION 2 ///////////////////

        if (this.selected_class) {
            console.log(this.selected_class);

            let selectedChoices = this.section2.choices[this.selected_class.mesh];
            let selectedMaterial = this._scene.getMaterialByName(this.selected_class.material) as PBRMaterial;
            console.log("FOUND MATERIAL", selectedMaterial);

            const sectionTitle = new TextBlock("sectionTitle", this.section2.title);
            sectionTitle.width = 0.8;
            sectionTitle.height = "40px";
            sectionTitle.color = "white";
            sectionTitle.top = "100px";
            sectionTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            sectionTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            this.stackPanel.addControl(sectionTitle);

            selectedChoices.forEach((color) => {
                const btnChoice = Button.CreateSimpleButton("btnChoice", color.title);
                btnChoice.top = "0px";
                btnChoice.width = 1;
                btnChoice.height = "30px";
                btnChoice.color = "white";
                btnChoice.background = "gray";
                btnChoice.thickness = 1;
                btnChoice.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                btnChoice.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
                this.stackPanel.addControl(btnChoice);

                if (this.selected_class && this.selected_variant && this.selected_variant.title === color.title) {
                    btnChoice.background = "green";
                }

                btnChoice.onPointerDownObservable.add(() => {
                    this.selected_variant = color;
                    if (selectedMaterial) {
                        if (selectedMaterial.albedoTexture) {
                            selectedMaterial.albedoTexture = new Texture("./models/races/materials/" + color.material, this._scene, { invertY: false });
                        }
                    }
                    this.refreshUI();
                });
            });

            const section3Title = new TextBlock("section3Title", "Class Description");
            section3Title.width = 0.8;
            section3Title.height = "60px";
            section3Title.color = "white";
            section3Title.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            section3Title.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            section3Title.fontWeight = "bold";
            this.stackPanel.addControl(section3Title);

            const section3Description = new TextBlock("section3Description", this.selected_class.description);
            section3Description.width = 0.8;
            section3Description.height = "100px";
            section3Description.color = "white";
            section3Description.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            section3Description.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            section3Description.fontSize = "16px";
            section3Description.textWrapping = TextWrapping.WordWrap;
            section3Description.resizeToFit = true;
            this.stackPanel.addControl(section3Description);
        }
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
