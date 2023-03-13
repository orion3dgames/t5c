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

export class AnimationScene {
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

        let CHARACTER_DATA = {
            GENDER: {},
            BODY: {
                SKINNY: ["NPC_Man_Skinny_primitive0", "NPC_Man_Skinny_primitive1"],
                NORMAL: ["NPC_Man_Normal_primitive0", "NPC_Man_Normal_primitive1"],
                FAT: ["NPC_Man_Fat_primitive0", "NPC_Man_Fat_primitive1"],
            },
            BEARD: ["NPC_Beard_001", "NPC_Beard_002", "NPC_Beard_003", "NPC_Beard_004", "NPC_Beard_005", "NPC_Beard_006", "NPC_Beard_007"],
            HAIR: ["NPC_Hair_001", "NPC_Hair_002", "NPC_Hair_003", "NPC_Hair_004", "NPC_Hair_005", "NPC_Hair_006", "NPC_Hair_007", "NPC_Hair_008"],
            HAT: ["NPC_Hat_001", "NPC_Hat_002", "NPC_Hat_003", "NPC_Hat_004", "NPC_Hat_005", "NPC_Hat_006"],
            WEAPON: ["NPC_Tools_Axe_001", "NPC_Tools_Axe_002", "NPC_Tools_Axe_003", "NPC_Tools_Hammer_01", "NPC_Tools_Pick_01", "NPC_Tools_Saw_001", "NPC_Tools_Shovel_001"],
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

        // load scene
        this._scene = scene;

        let result = await SceneLoader.ImportMeshAsync("", "./models/", "NPC_AllModels_Prefab.glb", scene);
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

        let beard = scene.getMeshByName("NPC_Beard_001");
        if (beard) {
            beard.isVisible = true;
        }

        let hair = scene.getMeshByName("NPC_Hair_001");
        if (hair) {
            hair.isVisible = true;
        }

        let sword = scene.getMeshByName("NPC_Tools_Axe_001");
        if (sword) {
            sword.isVisible = true;
        }

        ///////////////////////////////////////////////

        // set up ui
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;
        this._ui = guiMenu;

        // add main ui container
        const sidebarRect = new Rectangle("background");
        sidebarRect.left = 0;
        sidebarRect.width = 0.4;
        sidebarRect.height = 1;
        sidebarRect.thickness = 0;
        sidebarRect.paddingLeft = "15px";
        sidebarRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        guiMenu.addControl(sidebarRect);

        // main sidebar
        const sidebarStackPanel = new StackPanel("sidebarSctackPanel");
        sidebarStackPanel.width = "100%";
        sidebarStackPanel.adaptHeightToChildren = true;
        sidebarStackPanel.spacing = 5;
        sidebarStackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        sidebarStackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        sidebarStackPanel.paddingTop = "5px;";
        sidebarStackPanel.isVertical = true;
        sidebarRect.addControl(sidebarStackPanel);

        //
        // SIZE CHARACTER
        const genderPanel = this.createStackPanel("char_gender", sidebarStackPanel, false);
        this.createButton("Male", genderPanel, function (btn: Button) {
            console.log(btn.name);
        });
        this.createButton("Female", genderPanel, function (btn: Button) {
            console.log(btn.name);
        });

        //
        // SIZE CHARACTER
        const sizePanel = this.createStackPanel("char_size", sidebarStackPanel, false);
        this.createButton("Skinny", sizePanel, (btn: Button) => {
            this.showMeshes(["NPC_Man_Skinny_primitive0", "NPC_Man_Skinny_primitive1"]);
        });
        this.createButton("Normal", sizePanel, (btn: Button) => {
            this.showMeshes(["NPC_Man_Normal_primitive0", "NPC_Man_Normal_primitive1"]);
        });
        this.createButton("Fat", sizePanel, (btn: Button) => {
            this.showMeshes(["NPC_Man_Fat_primitive0", "NPC_Man_Fat_primitive1"]);
        });

        //
        // char beards
        const beardPanel = this.createStackPanel("beardPanel", sidebarStackPanel, false);[
        CHARACTER_DATA.BEARD.forEach((element) => {
            this.createButton(element, beardPanel, (btn: Button) => {
                CHARACTER_DATA.BEARD.forEach((b) => {
                    let beard = scene.getMeshByName(b);
                    if (beard) {
                        beard.isVisible = false;
                    }
                });
                let beard = scene.getMeshByName(element);
                if (beard) {
                    beard.isVisible = true;
                }
            });
        });
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
