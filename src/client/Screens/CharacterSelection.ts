import { Scene, Engine, Color4, Vector3, FreeCamera } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Button } from "@babylonjs/gui";
import { debug } from "console";
import Config from "../../shared/Config";
import { request } from "../../shared/Requests";
import State from "./Screens";

export class CharacterSelectionScene {
    
    public _scene: Scene;
    private _gui: AdvancedDynamicTexture;
    public _button: Button;

    constructor() {

    }

    public async createScene(engine) {

        global.T5C.currentUser = {
            id: 1,
            username: 'test',
            password: 'test',
            token: 'G5IgCLfAcBFgifKFLVycT'
        }

        // create scene
        let scene = new Scene(engine);

        // set color
        scene.clearColor = new Color4(0, 0, 0, 1);

        //creates and positions a free camera
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero()); //targets the camera to scene origin

        // set up ui
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI"); 
        guiMenu.idealHeight = 720;

        const imageRect = new Rectangle("titleContainer");
        imageRect.width = 1;
        imageRect.height = 1;
        imageRect.background = "#999999";
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

        const title = new TextBlock("title", "Welcome \n "+global.T5C.currentUser.username);
        title.resizeToFit = true;
        title.fontSize = "30px";
        title.color = "white";
        title.resizeToFit = true;
        title.top = "30px";
        title.width = 0.8;
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        imageRect.addControl(title);

        const startBtn = Button.CreateSimpleButton("play", "Play");
        startBtn.width = 0.2
        startBtn.height = "40px";
        startBtn.color = "white";
        startBtn.top = "-60px";
        startBtn.thickness = 1;
        startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        imageRect.addControl(startBtn);
        this._button = startBtn;

        // setup events
        this._button.onPointerDownObservable.add(() => { 
            global.T5C.nextScene = State.LOGIN;
        });

        this._scene = scene;

        await this._scene.whenReadyAsync();

        // 
        let user = await this.checkLogin();
        console.log(user);
        if(!user){
            Config.goToScene(State.LOGIN);
        }

    }

    async checkLogin(){

        // check user exists else send back to login
        let req = await request('post', Config.loginUrlLocal+'/check', {
            token: global.T5C.currentUser.token,
        });

        return JSON.parse(req.data).user;
    }

}