import { Engine, Scene, Color4, Vector3, FreeCamera } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Button, InputText, InputPassword } from "@babylonjs/gui";
import Config from "../../shared/Config";
import State from "./Screens";
import { generateRandomPlayerName } from "../../shared/Utils";
import { request } from "../../shared/Requests"
export class LoginScene {
    
    private _engine: Engine;
    public _scene: Scene;
    public _newState: State;
    public _button: Button;
    public _ui;

    constructor() {
        this._newState = State.NULL;
    }

    public async createScene(engine, client) {

        this._engine = engine;

        let scene = new Scene(engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        //creates and positions a free camera
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero()); //targets the camera to scene origin

        //--GUI--
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;

        //background image
        const imageRect = new Rectangle("titleContainer");
        imageRect.width = 1;
        imageRect.height = 1;
        imageRect.background = "#999999";
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

        const title = new TextBlock("title", "T5C");
        title.resizeToFit = true;
        title.fontSize = "40px";
        title.color = "white";
        title.resizeToFit = true;
        title.top = "30px";
        title.width = 0.8;
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        guiMenu.addControl(title);

        /*
        const backButton = Button.CreateSimpleButton("back", "Back");
        backButton.width = 0.2
        backButton.height = "40px";
        backButton.color = "white";
        backButton.top = "-60px";
        backButton.thickness = 1;
        backButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(backButton);*/

        const joinBtn = Button.CreateSimpleButton("back", "Connect To Game");
        joinBtn.width = 0.5
        joinBtn.height = "40px";
        joinBtn.color = "white";
        joinBtn.top = "40px";
        joinBtn.thickness = 1;
        joinBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        joinBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        guiMenu.addControl(joinBtn);

        ////////////////////////////
        // add username input 

        let randomName = generateRandomPlayerName();

        const usernameInput = new InputText("usernameInput");
        usernameInput.top = "-35px;";
        usernameInput.width = .5;
        usernameInput.height = '30px;'
        usernameInput.left = .25;
        usernameInput.color = "#FFF";
        usernameInput.placeholderText = "Enter username";
        usernameInput.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        usernameInput.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        guiMenu.addControl(usernameInput); 

        usernameInput.onKeyboardEventProcessedObservable.add(ev => {
            if (ev.key === "Tab") {
                guiMenu.focusedControl = passwordInput;
                ev.preventDefault();
            }
        })

        const passwordInput = new InputPassword("passwordInput");
        passwordInput.width = .5;
        passwordInput.height = '30px;'
        passwordInput.left = .25;
        passwordInput.color = "#FFF";
        passwordInput.placeholderText = "Enter password";
        passwordInput.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        passwordInput.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        guiMenu.addControl(passwordInput);  

        // connetc button
        joinBtn.onPointerDownObservable.add(() => { 
            this.connect(usernameInput.text, passwordInput.text);
            usernameInput.text = "";
            passwordInput.text = "";
        });

        this._ui = guiMenu;

        this._scene = scene;

        await this._scene.whenReadyAsync();

    }

    async connect(username:string, password:string){

        let req = await request('post', Config.loginUrlLocal+'/login', {
            username: username,
            password: password
        });

        global.T5C.currentUser = JSON.parse(req.data).user;

        Config.goToScene(State.START);

    }

}