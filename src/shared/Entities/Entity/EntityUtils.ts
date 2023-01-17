import { Scene } from "@babylonjs/core/scene";

export class EntityUtils {

    private _scene: Scene;
    private _room;

    constructor(scene: Scene, room) {
        this._scene = scene;
        this._room = room;
    }
    
}