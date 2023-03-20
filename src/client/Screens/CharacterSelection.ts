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
import { Image } from "@babylonjs/gui/2D/controls/image";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";

import State from "./Screens";
import { PlayerCharacter, PlayerUser } from "../../shared/types";
import { request, apiUrl, generateRandomPlayerName } from "../../shared/Utils";
import alertMessage from "../../shared/Utils/alertMessage";
import { dataDB } from "../../shared/Data/dataDB";
import { SceneController } from "../Controllers/Scene";

export class CharacterSelectionScene {
    public _scene: Scene;
    private _ui: AdvancedDynamicTexture;
    public _button: Button;

    private leftColumnRect;

    public async createScene(app) {
        // create scene
        let scene = new Scene(app.engine);

        // set color
        scene.clearColor = new Color4(0, 0, 0, 1);

        //creates and positions a free camera
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero()); //targets the camera to scene origin

        // set up ui
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;
        this._ui = guiMenu;

        // add main ui container
        const imageRect = new Rectangle("background");
        imageRect.width = 1;
        imageRect.height = 1;
        imageRect.background = "#999999";
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

        // add image
        var img = new Image("image", "./images/background_mainmenu_1.jpg");
        img.stretch = Image.STRETCH_FILL;
        imageRect.addControl(img);

        //////////////////////////////////////////////////////////////

        // left columm
        const leftColumnRect = new Rectangle("columnLeft");
        leftColumnRect.top = 0;
        leftColumnRect.left = "30px";
        leftColumnRect.width = "320px";
        leftColumnRect.height = 1;
        leftColumnRect.background = "#000000";
        leftColumnRect.thickness = 0;
        leftColumnRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        leftColumnRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        imageRect.addControl(leftColumnRect);

        const leftColumnRectPad = new Rectangle("leftColumnRectPad");
        leftColumnRectPad.top = 0;
        leftColumnRectPad.width = 0.9;
        leftColumnRectPad.height = 1;
        leftColumnRectPad.thickness = 0;
        leftColumnRectPad.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        leftColumnRectPad.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        leftColumnRect.addControl(leftColumnRectPad);
        this.leftColumnRect = leftColumnRectPad;

        // logo
        var imgLogo = new Image("imgLogo", "./images/logo.png");
        imgLogo.stretch = Image.STRETCH_UNIFORM;
        imgLogo.top = "30px";
        imgLogo.width = 1;
        imgLogo.height = "65px;";
        imgLogo.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        leftColumnRect.addControl(imgLogo);

        // welcome text
        const welcomeText = new TextBlock("infotext", "Welcome " + global.T5C.currentUser.username);
        welcomeText.width = 0.8;
        welcomeText.height = "40px";
        welcomeText.color = "white";
        welcomeText.top = "100px";
        welcomeText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        welcomeText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        leftColumnRect.addControl(welcomeText);

        // add scrollable container
        var scrollViewerBloc = new ScrollViewer("chat-scroll-viewer");
        scrollViewerBloc.width = 1;
        scrollViewerBloc.height = 0.4;
        scrollViewerBloc.left = "0px";
        scrollViewerBloc.top = "160px";
        scrollViewerBloc.background = "#222222";
        scrollViewerBloc.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        scrollViewerBloc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.leftColumnRect.addControl(scrollViewerBloc);

        // logout btn
        const logoutBtn = Button.CreateSimpleButton("logoutBtn", "Logout");
        logoutBtn.top = "-30px";
        logoutBtn.width = 1;
        logoutBtn.height = "30px";
        logoutBtn.color = "white";
        logoutBtn.thickness = 1;
        logoutBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        logoutBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.leftColumnRect.addControl(logoutBtn);
        logoutBtn.onPointerDownObservable.add(() => {
            this.logout();
        });

        const characterEditorBtn = Button.CreateSimpleButton("characterEditorBtn", "New Character");
        characterEditorBtn.top = "-70px";
        characterEditorBtn.width = 1;
        characterEditorBtn.height = "30px";
        characterEditorBtn.color = "white";
        characterEditorBtn.thickness = 1;
        characterEditorBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        characterEditorBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.leftColumnRect.addControl(characterEditorBtn);
        characterEditorBtn.onPointerDownObservable.add(() => {
            SceneController.goToScene(State.CHARACTER_EDITOR);
        });

        // load scene
        this._scene = scene;
        await this._scene.whenReadyAsync();

        // check if user token is valid
        let user: PlayerUser = await this.checkLogin();
        if (!user) {
            // if token not valid, send back to login screen
            SceneController.goToScene(State.LOGIN);
        }

        // SHOW AVAILABLE CHARACTERS GUI
        await this.displayCharactersGUI(user.characters as PlayerCharacter[], scrollViewerBloc);
    }

    async displayCharactersGUI(characters: PlayerCharacter[], scrollViewerBloc) {
        let top = 0;
        characters.forEach((char) => {
            const createBtn = Button.CreateSimpleButton("characterBtn-" + char.id, "Play as: " + char.name);
            createBtn.top = top + "px";
            createBtn.width = 1;
            createBtn.height = "30px";
            createBtn.background = "#000000";
            createBtn.color = "white";
            createBtn.thickness = 1;
            createBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            createBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            scrollViewerBloc.addControl(createBtn);
            createBtn.onPointerDownObservable.add(() => {
                this.loginAs(char);
            });

            top += 35;
        });
    }

    // login as this character
    loginAs(character: PlayerCharacter) {
        global.T5C.currentCharacter = character;
        global.T5C.currentLocationKey = character.location;
        global.T5C.currentLocation = dataDB.get("location", character.location);
        SceneController.goToScene(State.GAME);
    }

    // logout
    logout() {
        global.T5C.currentCharacter = null;
        global.T5C.currentLocationKey = null;
        global.T5C.currentLocation = null;
        SceneController.goToScene(State.LOGIN);
        // clear local storage
        localStorage.removeItem("t5c_token");
    }

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
            alertMessage(this._ui, "Something went wrong.");
        }
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
