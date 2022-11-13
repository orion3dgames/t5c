import { Scene, Engine, Color4, Vector3, FreeCamera } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Button } from "@babylonjs/gui";
import State from "./Screens";

export class StartScene {
    
    public _scene: Scene;
    private _gui: AdvancedDynamicTexture;
    public _button: Button;

    constructor() {

    }

    public async createScene(engine) {

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

        const title = new TextBlock("title", "T5C");
        title.resizeToFit = true;
        title.fontSize = "40px";
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
            window.nextScene = State.LOBBY;
        });

        this._scene = scene;

        await this._scene.whenReadyAsync();

        console.log('START SCENE CREATED');
    }

}