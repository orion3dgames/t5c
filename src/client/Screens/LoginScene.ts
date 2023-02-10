import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
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

export class LoginScene {
    public _scene: Scene;
    public _newState: State;
    public _button: Button;
    public _ui;

    constructor() {
        this._newState = State.NULL;
    }

    public async createScene(app) {
        let scene = new Scene(app.engine);
        scene.clearColor = new Color4(0, 0, 0, 1);

        //creates and positions a free camera
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero()); //targets the camera to scene origin

        //--GUI--
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;

        // background image
        const imageRect = new Rectangle("background");
        imageRect.width = 1;
        imageRect.height = 1;
        imageRect.background = "#999999";
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

        var img = new Image("image", "./images/background_mainmenu_1.jpg");
        img.stretch = Image.STRETCH_FILL;
        imageRect.addControl(img);

        // middle columm
        const columnRect = new Rectangle("column");
        columnRect.width = "320px";
        columnRect.height = 1;
        columnRect.background = "#000000";
        columnRect.thickness = 0;
        columnRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        imageRect.addControl(columnRect);

        // logo
        var imgLogo = new Image("imgLogo", "./images/logo.png");
        imgLogo.stretch = Image.STRETCH_UNIFORM;
        imgLogo.top = "30px";
        imgLogo.width = 1;
        imgLogo.height = "75px;";
        imgLogo.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        columnRect.addControl(imgLogo);

        // welcome text
        const welcomeText = new TextBlock("infotext", Config.version);
        welcomeText.width = 0.8;
        welcomeText.height = "40px";
        welcomeText.color = "white";
        welcomeText.top = "120px";
        welcomeText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        welcomeText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        columnRect.addControl(welcomeText);

        // FORM CONTAINER columm
        const formContainer = new Rectangle("formContainer");
        formContainer.width = 1;
        formContainer.height = "300px";
        formContainer.thickness = 0;
        formContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        formContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        columnRect.addControl(formContainer);

        ///////////////////////////////////////////
        // user token
        const token = localStorage.getItem("t5c_token");
        if (token) {
            // send login data
            let req = await request("get", apiUrl() + "/loginWithToken", {
                token: token,
            });

            // check req status
            if (req.status === 200) {
                // user was found or created
                global.T5C.currentUser = JSON.parse(req.data).user;

                // save token to local storage
                localStorage.setItem("t5c_token", JSON.parse(req.data).user.token);

                // go to character selection page
                SceneController.goToScene(State.CHARACTER_SELECTION);
            } else {
                // something went wrong
                alertMessage(this._ui, "Something went wrong.");
            }
        }

        ///////////////////////////////////////////
        // username input
        const usernameInput = new InputText("usernameInput");
        usernameInput.top = "-140px";
        usernameInput.width = 0.8;
        usernameInput.height = "30px;";
        usernameInput.color = "#FFF";
        usernameInput.text = "";
        //usernameInput.text = "test";
        usernameInput.placeholderText = "Enter username";
        usernameInput.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        usernameInput.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        formContainer.addControl(usernameInput);

        usernameInput.onKeyboardEventProcessedObservable.add((ev) => {
            if (ev.key === "Tab") {
                guiMenu.focusedControl = passwordInput;
                ev.preventDefault();
            }
        });

        ///////////////////////////////////////////
        // password input
        const passwordInput = new InputPassword("passwordInput");
        passwordInput.width = 0.8;
        passwordInput.height = "30px;";
        passwordInput.color = "#FFF";
        passwordInput.top = "-110px";
        passwordInput.text = "";
        passwordInput.placeholderText = "Enter password";
        passwordInput.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        passwordInput.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        formContainer.addControl(passwordInput);

        passwordInput.onKeyboardEventProcessedObservable.add((ev) => {
            if (ev.key === "Enter") {
                this.connect(usernameInput.text, passwordInput.text);
                usernameInput.text = "";
                passwordInput.text = "";
            }
        });

        ///////////////////////////////////////////
        // login button
        const joinBtn = Button.CreateSimpleButton("back", "Connect To Game");
        joinBtn.width = 0.8;
        joinBtn.height = "30px";
        joinBtn.color = "white";
        joinBtn.top = "-80px";
        joinBtn.thickness = 1;
        joinBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        joinBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        formContainer.addControl(joinBtn);

        joinBtn.onPointerDownObservable.add(() => {
            this.connect(usernameInput.text, passwordInput.text);
            usernameInput.text = "";
            passwordInput.text = "";
        });

        ///////////////////////////////////////////
        // guest button
        const joinGuestBtn = Button.CreateSimpleButton("joinGuestBtn", "Guest Login");
        joinGuestBtn.width = 0.8;
        joinGuestBtn.height = "30px";
        joinGuestBtn.color = "white";
        joinGuestBtn.top = "-30px";
        joinGuestBtn.thickness = 1;
        joinGuestBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        joinGuestBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        formContainer.addControl(joinGuestBtn);

        joinGuestBtn.onPointerDownObservable.add(() => {
            this.connect(generateRandomPlayerName(), generateRandomPlayerName());
        });

        // load scene
        this._ui = guiMenu;
        this._scene = scene;
        await this._scene.whenReadyAsync();
    }

    async connect(username: string, password: string) {
        // make sure both the username and password is entered.
        if (!username || !password) {
            alertMessage(this._ui, "Please enter both the username and the password.");
            return false;
        }

        // send login data
        let req = await request("get", apiUrl() + "/login", {
            username: username,
            password: password,
        });

        // check req status
        if (req.status === 200) {
            // user was found or created
            global.T5C.currentUser = JSON.parse(req.data).user;

            // save token to local storage
            localStorage.setItem("t5c_token", JSON.parse(req.data).user.token);

            // go to character selection page
            SceneController.goToScene(State.CHARACTER_SELECTION);
        } else {
            // something went wrong
            alertMessage(this._ui, "Something went wrong.");
        }
    }
}
