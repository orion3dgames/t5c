import { Engine, Scene, Color4, Vector3, FreeCamera } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Button, InputText, InputPassword, Image } from "@babylonjs/gui";
import Config from "../../shared/Config";
import State from "./Screens";
import { alertMessage, request, apiUrl } from "../../shared/Utils"

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

        // background image
        const imageRect = new Rectangle("background");
        imageRect.width = 1;
        imageRect.height = 1;
        imageRect.background = "#999999";
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

        var img = new Image("image", "./images/background_mainmenu_1.jpg")
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
        const title = new TextBlock("title", Config.title);
        title.top = "30px";
        title.fontSize = "40px";
        title.color = "white";
        title.width = 0.8;
        title.height = "40px";
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        columnRect.addControl(title);

        // welcome text
        const welcomeText = new TextBlock("infotext", "if account does not \n exist, it will create one");
        welcomeText.width = 0.8
        welcomeText.height = "40px";
        welcomeText.color = "white";
        welcomeText.top = "80px";
        welcomeText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        welcomeText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        columnRect.addControl(welcomeText);

        ///////////////////////////////////////////
        // username input 
        const usernameInput = new InputText("usernameInput");
        usernameInput.top = "-120px";
        usernameInput.width = .8;
        usernameInput.height = '30px;'
        usernameInput.color = "#FFF";
        usernameInput.text = "test";
        usernameInput.placeholderText = "Enter username";
        usernameInput.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        usernameInput.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        columnRect.addControl(usernameInput); 

        usernameInput.onKeyboardEventProcessedObservable.add(ev => {
            if (ev.key === "Tab") {
                guiMenu.focusedControl = passwordInput;
                ev.preventDefault();
            }
        })

        ///////////////////////////////////////////
        // password input
        const passwordInput = new InputPassword("passwordInput");
        passwordInput.width = .8;
        passwordInput.height = '30px;'
        passwordInput.color = "#FFF";
        passwordInput.top = "-80px";
        passwordInput.text = "test";
        passwordInput.placeholderText = "Enter password";
        passwordInput.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        passwordInput.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        columnRect.addControl(passwordInput);  

        passwordInput.onKeyboardEventProcessedObservable.add(ev => {
            if (ev.key === "Enter") {
                this.connect(usernameInput.text, passwordInput.text);
                usernameInput.text = "";
                passwordInput.text = "";
            }
        })

        ///////////////////////////////////////////
        // login button
        const joinBtn = Button.CreateSimpleButton("back", "Connect To Game");
        joinBtn.width = .8;
        joinBtn.height = "30px";
        joinBtn.color = "white";
        joinBtn.top = "-40px";
        joinBtn.thickness = 1;
        joinBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        joinBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        columnRect.addControl(joinBtn);

        joinBtn.onPointerDownObservable.add(() => { 
            this.connect(usernameInput.text, passwordInput.text);
            usernameInput.text = "";
            passwordInput.text = "";
        });

        // load scene
        this._ui = guiMenu;
        this._scene = scene;
        await this._scene.whenReadyAsync();

    }

    async connect(username:string, password:string){

        // make sure both the username and password is entered.
        if(!username || !password){
            alertMessage(this._ui, "Please enter both the username and the password.");
            return false;
        }

        // send login data
        let req = await request('get', apiUrl()+'/login', {
            username: username,
            password: password
        })

        // check req status
        if(req.status === 200){
            
            // user was found or created
            global.T5C.currentUser = JSON.parse(req.data).user;

            // go to character selection page
            Config.goToScene(State.CHARACTER_SELECTION);

        }else{

            // something went wrong
            alertMessage(this._ui, "Something went wrong.");
        }

    }

}