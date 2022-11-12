import { Scene, Color4, Vector3, FreeCamera } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, Button, ScrollViewer } from "@babylonjs/gui";

import State from "./Screens";

import { Room, RoomAvailable } from "colyseus.js";

export class LobbyScene {
    
    public _scene: Scene;
    public _newState: State;
    public _button: Button;
    public _ui;
    public _uiRooms;

    // multi
    private allRooms: RoomAvailable[] = [];
    private lobbyRoom: Room<any>;
    public roomId:string;
    public error: string;

    constructor() {
        this._newState = State.NULL;
        this.error = "";
    }

    public async createScene(engine, client) {


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

        const title = new TextBlock("title", "Lobby");
        title.resizeToFit = true;
        title.fontSize = "40px";
        title.color = "white";
        title.resizeToFit = true;
        title.top = "14px";
        title.width = 0.8;
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        guiMenu.addControl(title);

 
        const backButton = Button.CreateSimpleButton("back", "Back");
        backButton.width = 0.2
        backButton.height = "40px";
        backButton.color = "white";
        backButton.top = "-30px";
        backButton.thickness = 1;
        backButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(backButton);

        this._ui = guiMenu;

        // back button
        backButton.onPointerDownObservable.add(() => { 
            this._leaveLobby();
            window.nextScene = State.START;
        });

        //////////////////////////////////////////////////////
        // LOBBY

        // join lobby
        client.joinOrCreate("lobby").then((lobby) => {

            //////////////////////////
            // lobby events
            this.lobbyRoom = lobby;

            this.lobbyRoom.onMessage("rooms", (rooms) => {
                console.log('rooms', this.lobbyRoom);
                this.allRooms = rooms;
                this._refreshLobbyUI();
            });
    
            this.lobbyRoom.onMessage("+", ([roomId, room]) => {
                console.log('+ room', this.lobbyRoom);
                const roomIndex = this.allRooms.findIndex((room) => room.roomId === roomId);
                if (roomIndex !== -1) {
                    this.allRooms[roomIndex] = room;
                } else {
                    this.allRooms.push(room);
                }
                this._refreshLobbyUI();
            });
    
            this.lobbyRoom.onMessage("-", (roomId) => {
                this.allRooms = this.allRooms.filter((room) => room.roomId !== roomId);
                console.log('- room');
                this._refreshLobbyUI();
            });

            //////////////////////////
            // create button
            const startBtn = Button.CreateSimpleButton("start", "Create");
            startBtn.width = 0.2
            startBtn.height = "40px";
            startBtn.color = "white";
            startBtn.top = "-90px";
            startBtn.thickness = 1;
            startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            guiMenu.addControl(startBtn);
            
            startBtn.onPointerDownObservable.add(() => { 
                this._leaveLobby();
                window.nextScene = State.GAME;
            });

        }).catch((error) => {
            console.error(error);
            this.error = "Could not connect to server!";
        });


        scene.registerBeforeRender(() => {
            
            // if cannot connect to lobby, show an error message
            if(this.error !== ""){
                
                var sv = new ScrollViewer();
                sv.width = 0.8;
                sv.height = 0.6;
                sv.background = "#CCCCCC";
                sv.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                sv.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                this._ui.addControl(sv);

                var roomTxt = new TextBlock();
                roomTxt.text = this.error;
                roomTxt.textHorizontalAlignment = 0;
                roomTxt.height = "30px";
                roomTxt.fontSize = "16px";
                roomTxt.color = "red";
                roomTxt.left = .1;
                roomTxt.top = "0px";
                roomTxt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                sv.addControl(roomTxt);
            }

        });

        this._scene = scene;

        await this._scene.whenReadyAsync();
    }

    private _leaveLobby(){
        if(this.lobbyRoom){
            this.lobbyRoom.removeAllListeners();
            this.lobbyRoom.leave();
        }
    }

    private _refreshLobbyUI(){

        // add scrollable container
        var sv = new ScrollViewer();
        sv.width = 0.8;
        sv.height = 0.6;
        sv.background = "#CCCCCC";
        sv.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        sv.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this._ui.addControl(sv);

        var top = 0;
        this.allRooms.forEach(room => {

            // add room txt
            var roomTxt = new TextBlock("txtjoin_"+room.roomId, "Room | Players "+room.clients+"/10");
            roomTxt.textHorizontalAlignment = 0;
            roomTxt.height = "30px";
            roomTxt.fontSize = "16px";
            roomTxt.color = "white";
            roomTxt.left = .1;
            roomTxt.top = top+"px";
            roomTxt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            sv.addControl(roomTxt);

            // add room connect btn
            let joinBtn = Button.CreateSimpleButton("btnjoin_"+room.roomId, "JOIN");
            joinBtn.width = .2
            joinBtn.height = "30px";
            joinBtn.fontSize = "16px";
            joinBtn.color = "white";
            joinBtn.top = top+"px";
            joinBtn.thickness = 1;
            joinBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            sv.addControl(joinBtn);

            // increment top 
            top += 40;
        
            // add on click observable
            joinBtn.onPointerDownObservable.add(() => { 
                this._leaveLobby();
                window.currentRoomID = room.roomId;
                window.nextScene = State.GAME;

            });
        });
        
    }

}