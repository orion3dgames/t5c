import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";

import State from "./Screens";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Engine } from "@babylonjs/core/Engines/engine";
import { GameController } from "../Controllers/GameController";

export class CharacterSelectionScene {
    public _game: GameController;
    public _scene: Scene;
    public _engine: Engine;
    private _ui: AdvancedDynamicTexture;
    public _button: Button;
    private leftColumnRect;
    private rightColumnRect;
    private characterPanel;
    private scrollViewerBloc;

    private charactersUI: Rectangle[] = [];
    private selectedCharacter;

    public sceneRendered = false;

    public async createScene(game) {
        this._game = game;
        this._engine = game.engine;

        // create scene
        let scene = new Scene(this._engine);

        // set color
        scene.clearColor = new Color4(0.1, 0.1, 0.1, 1);

        //creates and positions a free camera
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero()); //targets the camera to scene origin

        // set up ui
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this._ui = guiMenu;

        // load scene
        this._scene = scene;
        await this._scene.whenReadyAsync();

        // if no user logged in, force a auto login
        // to be remove later or
        if (!this._game.isLoggedIn()) {
            await this._game.forceLogin();
        }

        // check if user token is valid
        let user = await this._game.isValidLogin();
        if (!user) {
            // if token not valid, send back to login screen
            this._game.setScene(State.LOGIN);
        }

        this.generateleftPanel();
        //this.generateRightPanel();

        if (user.characters.length > 0) {
            let index = user.characters.length - 1;
            this.selectCharacter(index, user.characters[index]);
        }

        // hide loading gui
        this._game.engine.hideLoadingUI();
    }

    generateleftPanel() {
        // left columm
        const leftColumnRect = new Rectangle("columnLeft");
        leftColumnRect.top = 0;
        leftColumnRect.left = 0;
        leftColumnRect.width = "320px";
        leftColumnRect.height = 1;
        leftColumnRect.background = "#000000";
        leftColumnRect.thickness = 0;
        leftColumnRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        leftColumnRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._ui.addControl(leftColumnRect);

        const leftColumnRectPad = new Rectangle("leftColumnRectPad");
        leftColumnRectPad.top = 0;
        leftColumnRectPad.width = 0.9;
        leftColumnRectPad.height = 1;
        leftColumnRectPad.thickness = 0;
        leftColumnRectPad.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        leftColumnRectPad.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        leftColumnRect.addControl(leftColumnRectPad);
        this.leftColumnRect = leftColumnRectPad;

        // welcome text
        const welcomeText = new TextBlock("infotext", "Welcome " + this._game.currentUser.username);
        welcomeText.width = 1;
        welcomeText.height = "100px;";
        welcomeText.color = "white";
        welcomeText.top = "0px";
        welcomeText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        welcomeText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        leftColumnRect.addControl(welcomeText);

        // BOTTOM ACTIONS
        const leftColumnBottomActions = new Rectangle("leftColumnBottomActions");
        leftColumnBottomActions.top = "-15px";
        leftColumnBottomActions.width = 1;
        leftColumnBottomActions.height = "70px;";
        leftColumnBottomActions.thickness = 0;
        leftColumnBottomActions.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        leftColumnBottomActions.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        leftColumnRectPad.addControl(leftColumnBottomActions);

        // logout btn
        const logoutBtn = Button.CreateSimpleButton("logoutBtn", "LOGOUT");
        logoutBtn.top = "0px";
        logoutBtn.width = 1;
        logoutBtn.height = "30px";
        logoutBtn.color = "white";
        logoutBtn.thickness = 1;
        logoutBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        logoutBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        leftColumnBottomActions.addControl(logoutBtn);
        logoutBtn.onPointerDownObservable.add(() => {
            this._game.logout();
        });

        const characterEditorBtn = Button.CreateSimpleButton("characterEditorBtn", "CREATE NEW CHARACTER");
        characterEditorBtn.top = "-40px";
        characterEditorBtn.width = 1;
        characterEditorBtn.height = "30px";
        characterEditorBtn.color = "white";
        characterEditorBtn.background = "orange";
        characterEditorBtn.thickness = 1;
        characterEditorBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        characterEditorBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        leftColumnBottomActions.addControl(characterEditorBtn);

        characterEditorBtn.onPointerDownObservable.add(() => {
            this._game.setScene(State.CHARACTER_EDITOR);
        });

        this.generateCharacters();
    }

    generateCharacters() {
        // add scrollable container
        var scrollViewerBloc = new ScrollViewer("chat-scroll-viewer");
        scrollViewerBloc.width = 1;
        scrollViewerBloc.height = 0.8;
        scrollViewerBloc.left = "0px";
        scrollViewerBloc.top = "80px";
        scrollViewerBloc.thickness = 0;
        scrollViewerBloc.background = "gray";
        scrollViewerBloc.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        scrollViewerBloc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.leftColumnRect.addControl(scrollViewerBloc);
        this.scrollViewerBloc = scrollViewerBloc;

        const rightStackPanel = new StackPanel("rightStackPanel");
        rightStackPanel.left = 0;
        rightStackPanel.top = 0;
        rightStackPanel.width = 1;
        rightStackPanel.height = 1;
        rightStackPanel.spacing = 5;
        rightStackPanel.adaptHeightToChildren = true;
        rightStackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        rightStackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        rightStackPanel.setPaddingInPixels(5, 5, 5, 5);
        rightStackPanel.isVertical = true;
        scrollViewerBloc.addControl(rightStackPanel);
        this.characterPanel = rightStackPanel;

        let user = this._game.currentUser;
        let bgColor = "#222222";

        if (user.characters.length > 0) {
            let i = 0;
            user.characters.forEach((char, k) => {
                let race = this._game.getGameData("race", char.race);

                const characterBloc = new Rectangle("characterBloc" + char.id);
                characterBloc.width = 1;
                characterBloc.height = "100px;";
                characterBloc.background = bgColor;
                characterBloc.thickness = 1;
                characterBloc.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                characterBloc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                rightStackPanel.addControl(characterBloc);

                this.charactersUI.push(characterBloc);

                if (this.selectedCharacter && this.selectedCharacter.id === char.id) {
                    characterBloc.background = "green";
                }

                var img = new Image("itemImage_" + char.id, "./images/portrait/" + race.icon + ".png");
                img.width = "40px;";
                img.height = "40px;";
                img.left = "20px";
                img.top = "20px";
                img.stretch = Image.STRETCH_FILL;
                img.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                img.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                characterBloc.addControl(img);

                const characterName = new TextBlock("characterName", char.name);
                characterName.width = 0.5;
                characterName.height = "30px";
                characterName.color = "white";
                characterName.left = "80px";
                characterName.top = "10px";
                characterName.fontWeight = "bold";
                characterName.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                characterName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                characterName.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                characterBloc.addControl(characterName);

                const characterDetails = new TextBlock("characterDetails", "Level: " + char.level);
                characterDetails.width = 0.5;
                characterDetails.height = "40px";
                characterDetails.color = "white";
                characterDetails.left = "80px";
                characterDetails.top = "25px";
                characterDetails.fontSize = "12px";
                characterDetails.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                characterDetails.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                characterDetails.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                characterBloc.addControl(characterDetails);

                const createBtn = Button.CreateSimpleButton("characterBtn-" + char.id, "PLAY");
                createBtn.left = "80px;";
                createBtn.top = "60px";
                createBtn.width = "100px";
                createBtn.height = "30px";
                createBtn.background = "orange";
                createBtn.color = "white";
                createBtn.thickness = 1;
                createBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                createBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                characterBloc.addControl(createBtn);

                createBtn.onPointerDownObservable.add(() => {
                    this._game.setCharacter(char);
                    this._game.setScene(State.GAME);
                });

                i++;
            });
        }
    }

    selectCharacter(index, char) {
        this.selectedCharacter = char;

        // reset selection
        this.charactersUI.forEach((element) => {
            element.background = "black";
        });

        // set current selected
        this.charactersUI[index].background = "green";
    }
}
