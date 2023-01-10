import { MeshBuilder, Vector3, Scene, Path3D, Color4, Texture, ParticleSystem, VertexBuffer } from "@babylonjs/core";
import State from "../../../client/Screens/Screens";
import Config from "../../Config";

export class EntityActions {

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

        
        /////////////////////////////////////////////

        // Create a particle system
        var particleSystem = new ParticleSystem("particles", 1000, this._scene);

        //Texture of each particle
        particleSystem.particleTexture = new Texture("textures/flare.png", this._scene);

        // Where the particles come from
        particleSystem.emitter = projectile; // the starting location

        // Colors of all particles
        particleSystem.color1 = new Color4(0.29, 0.96, 0.57, 1.0);
        particleSystem.color2 = new Color4(0.16, 0.8, 0.47, 1.0);
        particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);

        // Size of each particle (random between...
        particleSystem.minSize = 0.2;
        particleSystem.maxSize = 0.4;

        // Life time of each particle (random between...
        particleSystem.minLifeTime = 0.4;
        particleSystem.maxLifeTime = 0.5;

        // Emission rate
        particleSystem.emitRate = 1000;


        /******* Emission Space ********/
        particleSystem.createSphereEmitter(1);


        // Speed
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.01;

        // Start the particle system
        particleSystem.start();
      

        //////////////////////////////////////////////
  
        var endVector = projectile.calcMovePOV(0,0, 72).addInPlace(projectile.position);
        var points = [start, endVector];
        var path = new Path3D(points);

        var i = 0;
        var loop =  this._scene.onBeforeRenderObservable.add(() => {
            if (i <= 1) {
                console.log('NO COLLISION');
                projectile.position = path.getPointAt(i); 
                i += 0.009;
            } 

            if(projectile.intersectsMesh(mesh)){
                console.log('COLLISION', mesh);
                projectile.dispose(true, true);
                particleSystem.dispose(true);
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