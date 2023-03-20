import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { RadioGroup, SelectionPanel, SliderGroup } from "@babylonjs/gui/2D/controls/selector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

import { InputText } from "@babylonjs/gui/2D/controls/inputText";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";

import { SceneController } from "../Controllers/Scene";
import State from "./Screens";

import { request, apiUrl, generateRandomPlayerName } from "../../shared/Utils";
import { PlayerCharacter, PlayerUser } from "../../shared/types";
import { dataDB } from "../../shared/Data/dataDB";

export class CharacterEditor {
    public _scene: Scene;
    public _newState: State;
    public _button: Button;
    public _ui;

    public results;

    constructor() {
        this._newState = State.NULL;
    }

    public async createScene(app) {
        /*
        Adventurer_Body_primitive0
        Adventurer_Body_primitive1
        Adventurer_Body_primitive2
        Adventurer_Feet_primitive0
        Adventurer_Feet_primitive1
        Adventurer_Head_primitive0
        Adventurer_Head_primitive1
        Adventurer_Head_primitive2
        Adventurer_Head_primitive3
        Adventurer_Legs_primitive0
        Adventurer_Legs_primitive1
        Backpack_primitive0
        Backpack_primitive1
        Backpack_primitive2
        Backpack_primitive3
        Beach_Body_primitive0
        Beach_Body_primitive1
        Beach_Feet_primitive0
        Beach_Feet_primitive1
        Beach_Head_primitive0
        Beach_Head_primitive1
        Beach_Head_primitive2
        Beach_Head_primitive3
        Beach_Head_primitive4
        Beach_Legs_primitive0
        Beach_Legs_primitive1
        Beach_Legs_primitive2
        Casual2_Body_primitive0
        Casual2_Body_primitive1
        Casual2_Feet_primitive0
        Casual2_Feet_primitive1
        Casual2_Head_primitive0
        Casual2_Head_primitive1
        Casual2_Head_primitive2
        Casual2_Head_primitive3
        Casual2_Head_primitive4
        Casual2_Legs
        Casual_Body_primitive0
        Casual_Body_primitive1
        Casual_Feet_primitive0
        Casual_Feet_primitive1
        Casual_Head_primitive0
        Casual_Head_primitive1
        Casual_Head_primitive2
        Casual_Head_primitive3
        Casual_Legs_primitive0
        Casual_Legs_primitive1
        Farmer_Body_primitive0
        Farmer_Body_primitive1
        Farmer_Body_primitive2
        Farmer_Body_primitive3
        Farmer_Feet_primitive0
        Farmer_Feet_primitive1
        Farmer_Head_primitive0
        Farmer_Head_primitive1
        Farmer_Head_primitive2
        Farmer_Head_primitive3
        Farmer_Head_primitive4
        Farmer_Pants
        Horse_Head_primitive0
        Horse_Head_primitive1
        Horse_Head_primitive2
        Horse_Head_primitive3
        Horse_Head_primitive4
        Horse_Head_primitive5
        King_Body_primitive0
        King_Body_primitive1
        King_Body_primitive2
        King_Body_primitive3
        King_Body_primitive4
        King_Feet
        King_Head_primitive0
        King_Head_primitive1
        King_Head_primitive2
        King_Head_primitive3
        King_Legs_primitive0
        King_Legs_primitive1
        King_Legs_primitive2
        
        Pistol_primitive1
        Pistol_primitive2
        Punk_Body_primitive0
        Punk_Body_primitive1
        Punk_Body_primitive2
        Punk_Feet_primitive0
        Punk_Feet_primitive1
        Punk_Head_primitive0
        Punk_Head_primitive1
        Punk_Head_primitive2
        Punk_Head_primitive3
        Punk_Head_primitive4
        Punk_Head_primitive5
        Punk_Legs_primitive0
        Punk_Legs_primitive1
        SpaceSuit_Body_primitive0
        SpaceSuit_Body_primitive1
        SpaceSuit_Body_primitive2
        SpaceSuit_Body_primitive3
        SpaceSuit_Feet_primitive0
        SpaceSuit_Feet_primitive1
        SpaceSuit_Head_primitive0
        SpaceSuit_Head_primitive1
        SpaceSuit_Head_primitive2
        SpaceSuit_Legs_primitive0
        SpaceSuit_Legs_primitive1
        SpaceSuit_Legs_primitive2
        SpaceSuit_Legs_primitive3
        Suit_Body_primitive0
        Suit_Body_primitive1
        Suit_Body_primitive2
        Suit_Body_primitive3
        Suit_Feet
        Suit_Head_primitive0
        Suit_Head_primitive1
        Suit_Head_primitive2
        Suit_Head_primitive3
        Suit_Legs
        Swat_Body_primitive0
        Swat_Body_primitive1
        Swat_Body_primitive2
        Swat_Feet
        Swat_Head_primitive0
        Swat_Head_primitive1
        Swat_Head_primitive2
        Swat_Legs_primitive0
        Swat_Legs_primitive1
        Worker_Body_primitive0
        Worker_Body_primitive1
        Worker_Body_primitive2
        Worker_Body_primitive3
        Worker_Feet_primitive0
        Worker_Feet_primitive1
        Worker_Head_primitive0
        Worker_Head_primitive1
        Worker_Head_primitive2
        Worker_Head_primitive3
        Worker_Head_primitive4
        Worker_Legs_primitive0
        Worker_Legs_primitive1
        */

        let CHARACTER_GENDER = {
            MALE: ["Casual2_Body_primitive0", "Casual2_Body_primitive1", "Casual2_Feet_primitive0", "Casual2_Feet_primitive1", "Casual2_Head_primitive0", "Casual2_Head_primitive1", "Casual2_Head_primitive2", "Casual2_Head_primitive3", "Casual2_Head_primitive4", "Casual2_Legs"],
            FEMALE: ["Casual_Body_primitive0", "Casual_Body_primitive1", "Casual_Feet_primitive0", "Casual_Feet_primitive1", "Casual_Head_primitive0", "Casual_Head_primitive1", "Casual_Head_primitive2", "Casual_Head_primitive3", "Casual_Head_primitive4", "Casual_Legs"],
        };

        let CHARACTER_SIZE = {
            LIGHT: ["NPC_Man_Skinny_primitive0", "NPC_Man_Skinny_primitive1"],
            NORMAL: ["NPC_Man_Normal_primitive0", "NPC_Man_Normal_primitive1"],
            HEAVY: ["NPC_Man_Fat_primitive0", "NPC_Man_Fat_primitive1"],
        };

        let CHARACTER_DATA = {
            WEAPON: ["None", "Sword_primitive0", "Sword_primitive1", "Sword_primitive2", "Pistol_primitive0"],
        };

        let scene = new Scene(app.engine);
        scene.clearColor = new Color4(0, 0, 0, 1);

        var camera = new ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 3, new Vector3(0, 0.5, 0), scene);
        camera.attachControl(app.canvas, true);

        camera.lowerRadiusLimit = 2;
        camera.upperRadiusLimit = 10;
        camera.wheelDeltaPercentage = 0.01;

        var light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
        light.intensity = 0.6;
        light.specular = Color3.Black();

        // Built-in 'ground' shape.
        const ground = MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);

        // load scene
        this._scene = scene;

        // check if user token is valid
        let user: PlayerUser = await this.checkLogin();
        if (!user) {
            // if token not valid, send back to login screen
            SceneController.goToScene(State.LOGIN);
        }

        // import
        let result = await SceneLoader.ImportMeshAsync("", "./models/", "male_all.glb", scene);
        this.results = result;
        console.log(result);

        result.meshes.forEach((element) => {
            console.log(element.name);
            element.isVisible = false;
        });

        ///////////////////////////////////////////////
        let animations = result.animationGroups;
        animations[0].stop();

        let ANIM_IDLE = animations[4];
        let ANIM_WALK = animations[22];
        let ANIM_DEATH = animations[0];

        ANIM_IDLE.play(true);

        let CHARACTER_ANIMATION = [ANIM_IDLE, ANIM_WALK, ANIM_DEATH];

        ///////////////////////////////////////////////

        // set up ui
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;
        this._ui = guiMenu;

        const usernameInput = new InputText("newCharacterInput");
        usernameInput.top = "-110px;";
        usernameInput.width = 1;
        usernameInput.height = "30px;";
        usernameInput.color = "#FFF";
        usernameInput.text = generateRandomPlayerName();
        usernameInput.placeholderText = "Enter username";
        usernameInput.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        usernameInput.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(usernameInput);

        // PLAY BUTTON
        const playBtn = Button.CreateSimpleButton("playBtn", "PLAY");
        playBtn.top = "-70px";
        playBtn.width = 1;
        playBtn.height = "30px";
        playBtn.color = "white";
        playBtn.background = "orange";
        playBtn.thickness = 1;
        playBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        playBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(playBtn);
        playBtn.onPointerDownObservable.add(() => {
            // create new character via database
            this.createCharacter(usernameInput.text).then((char) => {
                // login as this character
                this.loginAs(char);
                // reset text
                usernameInput.text = "";
            });
        });

        // BACK BUTTON
        const backBtn = Button.CreateSimpleButton("backBtn", "BACK");
        backBtn.top = "-30px";
        backBtn.width = 1;
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

        // EDITOR OPTIONS
        var animationsOptions = new RadioGroup("Animation");
        CHARACTER_ANIMATION.forEach((anim) => {
            animationsOptions.addRadio(anim.name, () => {
                CHARACTER_ANIMATION.forEach((element) => {
                    element.stop();
                });
                anim.start(true, 1.0, anim.from, anim.to, false);
            });
        });

        var sizeOptions = new RadioGroup("Gender");
        for (let key in CHARACTER_GENDER) {
            let data = CHARACTER_GENDER[key];
            sizeOptions.addRadio(key, () => {
                this.hideAll(CHARACTER_GENDER);
                data.forEach((b) => {
                    this.showMesh(b, true);
                });
            });
        }

        var rotateGroup = new SliderGroup("Body Options");
        for (let key in CHARACTER_DATA) {
            let data = CHARACTER_DATA[key];
            rotateGroup.addSlider(
                key,
                (v) => {
                    let index = v.toFixed(0);
                    let value = data[index];
                    data.forEach((b) => {
                        this.showMesh(b, false);
                    });
                    this.showMesh(value, true);
                },
                key,
                0,
                data.length - 1,
                0
            );
        }

        var selectBox = new SelectionPanel("sp", [sizeOptions, rotateGroup, animationsOptions]);
        selectBox.background = "rgba(255, 255, 255, .7)";
        selectBox.top = "15px;";
        selectBox.left = "15px;";
        selectBox.width = 0.25;
        selectBox.height = 0.9;
        selectBox.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        selectBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        guiMenu.addControl(selectBox);
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

    // check login details
    async checkLogin() {
        // check user exists else send back to login
        let req = await request("post", apiUrl() + "/check", {
            token: global.T5C.currentUser.token,
        });

        // check req status
        if (req.status === 200) {
            return JSON.parse(req.data).user;
        } else {
            // something went wrong
            //alertMessage(this._ui, "Something went wrong.");
        }
    }

    // login as this character
    loginAs(character: PlayerCharacter) {
        global.T5C.currentCharacter = character;
        global.T5C.currentLocationKey = character.location;
        global.T5C.currentLocation = dataDB.get("location", character.location);
        SceneController.goToScene(State.GAME);
    }

    // create character
    async createCharacter(name) {
        // make sure both the username and password is entered.
        if (!name) {
            return false;
        }

        // check user exists else send back to login
        let req = await request("post", apiUrl() + "/create_character", {
            token: global.T5C.currentUser.token,
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
