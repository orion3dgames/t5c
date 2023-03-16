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
        NPC_Hat_002
        NPC_Hat_003
        NPC_Hat_004
        NPC_Hat_005
        NPC_Hat_006
        NPC_Tools_Axe_001
        NPC_Tools_Axe_002
        NPC_Tools_Axe_003
        NPC_Tools_Hammer_01
        NPC_Tools_Pick_01
        NPC_Tools_Saw_001
        NPC_Tools_Shovel_001
        Fish_001
        Fruits_001
        Fruits_002
        NPC_Backet_001
        NPC_Backet_002
        NPC_Backet_003
        NPC_Backet_004
        NPC_Backet_005
        NPC_Backet_Empty
        NPC_Man_Fat_primitive0
        NPC_Man_Fat_primitive1
        NPC_Man_Normal_primitive0
        NPC_Man_Normal_primitive1
        NPC_Man_Skinny_primitive0
        NPC_Man_Skinny_primitive1
        Stone_001
        Wood_001
        */

        let CHARACTER_SIZE = {
            LIGHT: ["NPC_Man_Skinny_primitive0", "NPC_Man_Skinny_primitive1"],
            NORMAL: ["NPC_Man_Normal_primitive0", "NPC_Man_Normal_primitive1"],
            HEAVY: ["NPC_Man_Fat_primitive0", "NPC_Man_Fat_primitive1"],
        };

        let CHARACTER_DATA = {
            BEARD: ["None", "NPC_Beard_001", "NPC_Beard_002", "NPC_Beard_003", "NPC_Beard_004", "NPC_Beard_005", "NPC_Beard_006", "NPC_Beard_007"],
            HAIR: ["None", "NPC_Hair_001", "NPC_Hair_002", "NPC_Hair_003", "NPC_Hair_004", "NPC_Hair_005", "NPC_Hair_006", "NPC_Hair_007", "NPC_Hair_008"],
            HAT: ["None", "NPC_Hat_001", "NPC_Hat_002", "NPC_Hat_003", "NPC_Hat_004", "NPC_Hat_005", "NPC_Hat_006"],
            WEAPON: ["None", "NPC_Tools_Axe_001", "NPC_Tools_Axe_002", "NPC_Tools_Axe_003", "NPC_Tools_Hammer_01", "NPC_Tools_Pick_01", "NPC_Tools_Saw_001", "NPC_Tools_Shovel_001"],
        };

        /*
        Fish_001
        Fruits_001
        Fruits_002
        NPC_Backet_001
        NPC_Backet_002
        NPC_Backet_003
        NPC_Backet_004
        NPC_Backet_005
        NPC_Backet_Empty
        Stone_001
        Wood_001
        */

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

        let result = await SceneLoader.ImportMeshAsync("", "./models/", "player.glb", scene);
        this.results = result;
        console.log(result);

        result.geometries.forEach((element) => {
            console.log(element.id);
        });

        result.meshes.forEach((element) => {
            element.isVisible = false;
            if (element.name === "NPC_Man_Normal_primitive0" || element.name === "NPC_Man_Skinny_primitive1") {
                element.isVisible = true;
            }
        });

        ///////////////////////////////////////////////
        let animations = result.animationGroups;
        animations[0].stop();

        let ANIM_IDLE = animations[5];
        let ANIM_WALK = animations[1];
        let ANIM_DEATH = animations[19];

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

        var sizeOptions = new RadioGroup("Body Size");
        for (let key in CHARACTER_SIZE) {
            let data = CHARACTER_SIZE[key];
            sizeOptions.addRadio(key, () => {
                data.forEach((b) => {
                    this.showMesh(key, true);
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

    showMeshes(stringArray: string[] = []) {
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
