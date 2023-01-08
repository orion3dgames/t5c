import { MeshBuilder, Vector3, Scene, Path3D } from "@babylonjs/core";
import State from "../../../client/Screens/Screens";
import Config from "../../Config";

export class PlayerActions {

    private _scene: Scene;

    constructor(scene) {
        this._scene = scene;
    }

    public attack(data, mesh, ui) {

        // send bullet locally
        let start = data.fromPosition;
        let end = data.toPosition;
        this.fire(
            new Vector3(start.x, start.y, start.z), 
            new Vector3(end.x, end.y, end.z), 
            mesh
        );

        ui.addChatMessage({
            senderID: "SYSTEM",
            message: data.message,
            name: "SYSTEM",
            timestamp: 0,
            createdAt: ""
        });
    }

    public fire(start, end, mesh) {
        console.log('FIRE', start, end);
        var angle = Math.atan2((start.z - end.z), (start.x - end.x ));
        var projectile = MeshBuilder.CreateSphere('Projectile', {diameter: 0.4}, this._scene);
        projectile.position = start.clone();
        projectile.position.y = 2;
        projectile.rotation.y = (Math.PI/2) - angle;
  
        var endVector = projectile.calcMovePOV(0,0, 72).addInPlace(projectile.position);
        var points = [start, endVector];
        var path = new Path3D(points);

        var i = 0;
        var loop =  this._scene.onBeforeRenderObservable.add(() => {
            if (i <= 1) {
                console.log('NO COLLISION');
                projectile.position = path.getPointAt(i); 
                i += 0.01;
            } 

            if(projectile.intersectsMesh(mesh)){
                console.log('COLLISION', mesh);
                projectile.dispose(true, true);
                this._scene.onBeforeRenderObservable.remove(loop);
            }

        });

    }


    public async teleport(room, location) {
        await room.leave();
        global.T5C.currentLocation = Config.locations[location];
        global.T5C.currentCharacter.location = location;
        global.T5C.nextScene = State.GAME;
    }

}