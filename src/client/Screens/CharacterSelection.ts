import { Scene, Engine, Color4, Vector3, FreeCamera } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Button, InputText } from "@babylonjs/gui";
import { debug } from "console";
import Config from "../../shared/Config";
import { request } from "../../shared/Requests";
import State from "./Screens";
import { PlayerCharacter, PlayerUser } from "../../shared/types";

export class CharacterSelectionScene {
    
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

        const title = new TextBlock("title", "Welcome \n "+global.T5C.currentUser.username);
        title.resizeToFit = true;
        title.fontSize = "30px";
        title.color = "white";
        title.resizeToFit = true;
        title.top = "30px";
        title.width = 0.8;
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        imageRect.addControl(title);

        this._scene = scene;
        this._gui = guiMenu;

        await this._scene.whenReadyAsync();

        // check if user token is valid
        let user:PlayerUser = await this.checkLogin();
        if(!user){
            // if token not valid, send back to login screen
            Config.goToScene(State.LOGIN);
        }

        // SHOW AVAILABLE CHARACTERS GUI
        await this.displayCharactersGUI(user.characters as PlayerCharacter[]);
        
        // SHOW NEW PLAYER GUI
        await this.displayCreateNewCharacterGUI();
    }

    async displayCreateNewCharacterGUI(){

        const usernameInput = new InputText("newCharacterInput");
        usernameInput.top = "-90px;";
        usernameInput.width = .5;
        usernameInput.height = '30px;'
        usernameInput.left = .25;
        usernameInput.color = "#FFF";
        usernameInput.placeholderText = "Enter username";
        usernameInput.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        usernameInput.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._gui.addControl(usernameInput); 

        const createBtn = Button.CreateSimpleButton("newCharacterBtn", "Create New Character");
        createBtn.top = "-60px";
        createBtn.width = .5;
        createBtn.height = "30px";
        createBtn.color = "white";
        createBtn.thickness = 1;
        createBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        createBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._gui.addControl(createBtn);

        createBtn.onPointerDownObservable.add(() => { 
            
            // create new character via database 
            this.createCharacter(usernameInput.text).then((char)=>{

                console.log('CREATED', char);

                // login as this character
                this.loginAs(char);

                // reset text
                usernameInput.text = "";
            });

        });

    }

    async displayCharactersGUI(characters:PlayerCharacter[]){

        let top = 100;
        characters.forEach(char => {

            const createBtn = Button.CreateSimpleButton("characterBtn-"+char.id, "Play as: "+char.name);
            createBtn.top = top+"px";
            createBtn.width = .5;
            createBtn.height = "30px";
            createBtn.color = "white";
            createBtn.thickness = 1;
            createBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            createBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            this._gui.addControl(createBtn);

            createBtn.onPointerDownObservable.add(() => { 
                this.loginAs(char);
            });

            top += 35;
        });

    }

    // login as this character
    loginAs(character:PlayerCharacter){
        global.T5C.currentCharacter = character;
        global.T5C.currentLocationKey = character.location;
        global.T5C.currentLocation = Config.locations[character.location];
        Config.goToScene(State.GAME);
    }

    // check login details
    async checkLogin(){

        // check user exists else send back to login
        let req = await request('post', Config.apiUrlLocal+'/check', {
            token: global.T5C.currentUser.token,
        });

        return JSON.parse(req.data).user;
    }

    // create character
    async createCharacter(name){

        // check user exists else send back to login
        let req = await request('post', Config.apiUrlLocal+'/create_character', {
            token: global.T5C.currentUser.token,
            name: name
        });

        return JSON.parse(req.data).character;
    }


}