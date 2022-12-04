import { Scene, MeshBuilder, Path3D} from "@babylonjs/core";

export class PlayerUtils {

    private _scene: Scene;
    private _room;

    constructor(scene: Scene, room) {
        this._scene = scene;
        this._room = room;
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
                i += 0.001;
            } 

            if(projectile.intersectsMesh(mesh)){
                console.log('COLLISION', mesh);
                projectile.dispose(true, true);
                this._scene.onBeforeRenderObservable.remove(loop);
            }

        });

    }

}