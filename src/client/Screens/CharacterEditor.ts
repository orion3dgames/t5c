import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";

import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { InputText } from "@babylonjs/gui/2D/controls/inputText";
import { InputPassword } from "@babylonjs/gui/2D/controls/inputPassword";
import { Image } from "@babylonjs/gui/2D/controls/image";

import Config from "../../shared/Config";
import State from "./Screens";
import { request, apiUrl, generateRandomPlayerName } from "../../shared/Utils";
import alertMessage from "../../shared/Utils/alertMessage";
import { SceneController } from "../Controllers/Scene";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { CheckboxGroup, RadioGroup, SelectionPanel, SliderGroup } from "@babylonjs/gui/2D/controls/selector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

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
}
