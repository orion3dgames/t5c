import { Engine, Scene, Color4, Vector3, FreeCamera } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Button, InputText } from "@babylonjs/gui";
import { firebaseController } from "../Controllers/Firebase/firebase";
import Config from "../../shared/Config";
import State from "./Screens";

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

        const title = new TextBlock("title", "LOGIN");
        title.resizeToFit = true;
        title.fontSize = "40px";
        title.color = "white";
        title.resizeToFit = true;
        title.top = "30px";
        title.width = 0.8;
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        guiMenu.addControl(title);

        const backButton = Button.CreateSimpleButton("back", "Back");
        backButton.width = 0.2
        backButton.height = "40px";
        backButton.color = "white";
        backButton.top = "-60px";
        backButton.thickness = 1;
        backButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(backButton);

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
        const chat_input = new InputText();
        chat_input.width = .5;
        chat_input.height = '30px;'
        chat_input.left = .25;
        chat_input.color = "#FFF";
        chat_input.placeholderText = "Enter player name...";
        chat_input.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        chat_input.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        guiMenu.addControl(chat_input); 

        // chatbox on enter event
        chat_input.onKeyboardEventProcessedObservable.add((ev) => { 
            if((ev.key==="Enter" || ev.code==="Enter") && chat_input.text != ""){
                this.connect(chat_input.text);
                chat_input.text = "";
            }
        });

        // connetc button
        joinBtn.onPointerDownObservable.add(() => { 
            this.connect(chat_input.text);
            chat_input.text = "";
        });

        // back button
        backButton.onPointerDownObservable.add(() => { 
            Config.goToScene(State.START);
        });

        this._ui = guiMenu;

        this._scene = scene;

        await this._scene.whenReadyAsync();

    }

    async connect(username){
        await firebaseController.loginAnonymously(username).then((auth)=>{
            Config.goToScene(State.GAME, auth);
        });
    }

}