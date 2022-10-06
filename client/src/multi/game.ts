import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { Room } from "colyseus.js";

import Menu from "./menu";

import { createSkyBox } from "./utils";

const GROUND_SIZE = 500;

export default class Game {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private camera: BABYLON.ArcRotateCamera;
    private light: BABYLON.Light;

    private room: Room<any>;
    private playerEntities: { [playerId: string]: BABYLON.Mesh } = {};
    private playerNextPosition: { [playerId: string]: BABYLON.Vector3 } = {};

    constructor(canvas: HTMLCanvasElement, engine: BABYLON.Engine, room: Room<any>) {
        this.canvas = canvas;
        this.engine = engine;
        this.room = room;
    }

    initPlayers(): void {
        this.room.state.players.onAdd((player, sessionId) => {

            const isCurrentPlayer = (sessionId === this.room.sessionId);

            const sphere = BABYLON.MeshBuilder.CreateSphere(`player-${sessionId}`, {
                segments: 8,
                diameter: 40
            }, this.scene);

            // Set player mesh properties
            const sphereMaterial = new BABYLON.StandardMaterial(`playerMat-${sessionId}`, this.scene);
            sphereMaterial.emissiveColor = (isCurrentPlayer) ? BABYLON.Color3.FromHexString("#ff9900") : BABYLON.Color3.Gray();
            sphere.material = sphereMaterial;

            // Set player spawning position
            sphere.position.set(player.x, player.y, player.z);

            this.playerEntities[sessionId] = sphere;
            this.playerNextPosition[sessionId] = sphere.position.clone();

            // update local target position
            player.onChange(() => {
                this.playerNextPosition[sessionId].set(player.x, player.y, player.z);
            });

        });

        this.room.state.players.onRemove((player, playerId) => {
            this.playerEntities[playerId].dispose();
            delete this.playerEntities[playerId];
            delete this.playerNextPosition[playerId];
        });

        this.room.onLeave(code => {
            this.gotoMenu();
        })
    }

    createGround(): void {
        // Create ground plane
        const plane = BABYLON.MeshBuilder.CreatePlane("plane", { size: GROUND_SIZE }, this.scene);
        plane.position.y = -15;
        plane.rotation.x = Math.PI / 2;

        let floorPlane = new BABYLON.StandardMaterial('floorTexturePlane', this.scene);
        floorPlane.diffuseTexture = new BABYLON.Texture('./public/ground.jpg', this.scene);
        floorPlane.backFaceCulling = false; // Always show the front and the back of an element

        let materialPlane = new BABYLON.MultiMaterial('materialPlane', this.scene);
        materialPlane.subMaterials.push(floorPlane);

        plane.material = materialPlane;
    }

    displayGameControls() {
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("textUI");

        const playerInfo = new GUI.TextBlock("playerInfo");
        playerInfo.text = `Room name: ${this.room.name}      Player: ${this.room.sessionId}`.toUpperCase();
        playerInfo.color = "#eaeaea";
        playerInfo.fontFamily = "Roboto";
        playerInfo.fontSize = 20;
        playerInfo.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        playerInfo.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        playerInfo.paddingTop = "10px";
        playerInfo.paddingLeft = "10px";
        playerInfo.outlineColor = "#000000";
        advancedTexture.addControl(playerInfo);

        const instructions = new GUI.TextBlock("instructions");
        instructions.text = "CLICK ANYWHERE ON THE GROUND!";
        instructions.color = "#fff000"
        instructions.fontFamily = "Roboto";
        instructions.fontSize = 24;
        instructions.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        instructions.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        instructions.paddingBottom = "10px";
        advancedTexture.addControl(instructions);

        // back to menu button
        const button = GUI.Button.CreateImageWithCenterTextButton("back", "<- BACK", "./public/btn-default.png");
        button.width = "100px";
        button.height = "50px";
        button.fontFamily = "Roboto";
        button.thickness = 0;
        button.color = "#f8f8f8";
        button.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        button.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        button.paddingTop = "10px";
        button.paddingRight = "10px";
        button.onPointerClickObservable.add(async () => {
            await this.room.leave(true);
        });
        advancedTexture.addControl(button);
    }

    bootstrap(): void {
        this.scene = new BABYLON.Scene(this.engine);
        this.light = new BABYLON.HemisphericLight("pointLight", new BABYLON.Vector3(), this.scene);
        this.camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, 1.0, 550, BABYLON.Vector3.Zero(), this.scene);
        this.camera.setTarget(BABYLON.Vector3.Zero());

        createSkyBox(this.scene);
        this.createGround();
        this.displayGameControls();
        this.initPlayers();

        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
              case BABYLON.KeyboardEventTypes.KEYDOWN:
                console.log("KEY DOWN: ", kbInfo.event.key);
                break;
              case BABYLON.KeyboardEventTypes.KEYUP:
                console.log("KEY UP: ", kbInfo.event.code);
                break;
            }
        });

        this.scene.onPointerDown = (event, pointer) => {
            if (event.button == 0) {
                const targetPosition = pointer.pickedPoint.clone();

                // Position adjustments for the current play ground.
                targetPosition.y = -1;
                if (targetPosition.x > 245) targetPosition.x = 245;
                else if (targetPosition.x < -245) targetPosition.x = -245;
                if (targetPosition.z > 245) targetPosition.z = 245;
                else if (targetPosition.z < -245) targetPosition.z = -245;

                this.playerNextPosition[this.room.sessionId] = targetPosition;

                // Send position update to the server
                this.room.send("updatePosition", {
                    x: targetPosition.x,
                    y: targetPosition.y,
                    z: targetPosition.z,
                });
            }
        };

        this.doRender();
    }

    private gotoMenu() {
        this.scene.dispose();
        const menu = new Menu('renderCanvas');
        menu.createMenu();
    }

    private doRender(): void {
        // constantly lerp players
        this.scene.registerBeforeRender(() => {
            for (let sessionId in this.playerEntities) {
              const entity = this.playerEntities[sessionId];
              const targetPosition = this.playerNextPosition[sessionId];
              entity.position = BABYLON.Vector3.Lerp(entity.position, targetPosition, 0.05);
            }
        });

        // Run the render loop.
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }
}
