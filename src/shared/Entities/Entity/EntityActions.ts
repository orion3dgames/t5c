import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4, Color3 } from "@babylonjs/core/Maths/math.color";
import { Path3D } from "@babylonjs/core/Maths/math.path";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

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

        // calculate angle
        var angle = Math.atan2((start.z - end.z), (start.x - end.x ));

        // reate material
        var material = new StandardMaterial('player_spell');
        material.diffuseColor = Color3.FromInts(249, 115, 0);

        // create mesh
        var projectile = MeshBuilder.CreateSphere('Projectile', {segments: 4, diameter: 0.4}, this._scene);
        projectile.material = material;
        projectile.position = start.clone();
        projectile.position.y = 2;
        projectile.rotation.y = (Math.PI/2) - angle;

        //////////////////////////////////////////////
        // create a particle system
        var particleSystem = new ParticleSystem("particles", 2000, this._scene);
        particleSystem.particleTexture = new Texture("textures/flare.png", this._scene);
        particleSystem.emitter = projectile; // the starting location
        // Colors of all particles
        particleSystem.color1 = new Color4(1, 0, 0, 1.0);
        particleSystem.color2 = new Color4(1, 0.1, 0.1, 1.0);
        particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);
        // Size of each particle (random between...
        particleSystem.minSize = 0.4;
        particleSystem.maxSize = 0.5;
        // Life time of each particle (random between...
        particleSystem.minLifeTime = 0.05;
        particleSystem.maxLifeTime = 0.2;
        // Emission rate
        particleSystem.emitRate = 1000;
        particleSystem.createSphereEmitter(1);
        // Speed
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 5;
        particleSystem.updateSpeed = 0.01;
        // Start the particle system
        particleSystem.start();
        //////////////////////////////////////////////
  
        var endVector = projectile.calcMovePOV(0, 0, 72).addInPlace(projectile.position);
        var points = [start, endVector];
        var path = new Path3D(points);
        var i = 0;
        var loop =  this._scene.onBeforeRenderObservable.add(() => {
            if (i <= 1) {
                projectile.position = path.getPointAt(i); 
                i += 0.004;
            } 
            if(projectile.intersectsMesh(mesh) || i === 1){
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