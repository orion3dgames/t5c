import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4, Color3 } from "@babylonjs/core/Maths/math.color";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Tools } from "@babylonjs/core/Misc/tools";
import { nanoid } from "nanoid";
import { GameScene } from "../../Screens/GameScene";

export class EntityActions {
    private _gamescene: GameScene;
    private _scene: Scene;
    private _loadedAssets: any[];
    private _entities;
    private particleTxt_01: Texture;
    private projectiles = new Map();

    private colors = {
        white: [Color3.FromInts(255, 255, 255), Color3.FromInts(240, 240, 240)],
        green: [Color3.FromInts(64, 141, 33), Color3.FromInts(146, 245, 107)],
        orange: [Color3.FromInts(249, 115, 0), Color3.FromInts(222, 93, 54)],
    };

    constructor(scene, _loadedAssets, entities, gamescene) {
        this._gamescene = gamescene;
        this._scene = scene;
        this._entities = entities;
        this._loadedAssets = _loadedAssets;
        this.particleTxt_01 = this._loadedAssets["TXT_particle_01"];
    }

    public playSound() {}

    public update() {
        this.projectiles.forEach((element, key) => {
            //
            let targetMesh = element.target.mesh;
            let end = element.target.getPosition();
            end.y = 1; // fix to hit in the center of body
            element.projectile.lookAt(end);
            element.projectile.rotate(new Vector3(0, 1, 0), Tools.ToRadians(180));

            // calculate next position
            var endVector = element.projectile.calcMovePOV(0, 0, 0.4).addInPlace(element.projectile.position);
            element.projectile.position = endVector;

            // if intersect with target mesh then display impact
            if (element.projectile.intersectsMesh(targetMesh, true)) {
                this.particule_impact(targetMesh, element.color);
                element.projectile.dispose(true, true);
                element.particleSystem.dispose(true);
                element.particleSystemTrail.dispose(true);
                this.projectiles.delete(key);
            }
        });
    }

    public process(player, data, ability) {
        /*
        let soundToPlay = this._scene.getSoundByName("sound_"+ability.key);
        if(!soundToPlay){
            // play sound
            let soundData = this._loadedAssets[ability.sound];
            let sound = new Sound("sound_"+ability.key, soundData, this._scene, function(){ sound.play(); }, {
                volume: 0.3
            });
        }
        */

        //
        let source = this._entities.get(data.fromId);
        let target = this._entities.get(data.targetId);

        // set effect
        if (ability.effect.particule === "fireball") {
            this.particule_fireball(source, target, ability.effect.color);
        }

        if (ability.effect.particule === "heal") {
            this.particule_heal(target, ability.effect.color);
        }
    }

    public particule_impact(mesh, color) {
        //////////////////////////////////////////////
        // create a particle system
        var particleSystem = new ParticleSystem("particles", 1000, this._scene);
        particleSystem.particleTexture = this.particleTxt_01.clone();
        particleSystem.emitter = mesh; // the starting location
        // Colors of all particles
        particleSystem.color1 = Color4.FromColor3(this.colors[color][0]);
        particleSystem.color2 = Color4.FromColor3(this.colors[color][1]);
        particleSystem.colorDead = new Color4(0, 0, 0, 1);
        // Size of each particle (random between...
        particleSystem.minSize = 0.3;
        particleSystem.maxSize = 0.6;
        // Life time of each particle (random between...
        particleSystem.minLifeTime = 1;
        particleSystem.maxLifeTime = 1.25;
        particleSystem.targetStopDuration = 1.25;
        // Emission rate
        particleSystem.emitRate = 1000;
        particleSystem.createSphereEmitter(1);

        particleSystem.updateSpeed = 0.1;
        // Start the particle system
        particleSystem.start();
        //////////////////////////////////////////////

        setTimeout(() => {
            particleSystem.dispose(true);
        }, 1000);
        //
    }

    public particule_heal(target, color) {
        // get mesh
        let mesh = target.mesh;

        //////////////////////////////////////////////
        // create a particle system
        var particleSystem = new ParticleSystem("particles", 1000, this._scene);
        particleSystem.particleTexture = this.particleTxt_01.clone();
        particleSystem.emitter = mesh; // the starting location
        // Colors of all particles
        particleSystem.color1 = Color4.FromColor3(this.colors[color][0]);
        particleSystem.color2 = Color4.FromColor3(this.colors[color][1]);
        particleSystem.colorDead = new Color4(0, 0, 0, 1);
        // Size of each particle (random between...
        particleSystem.minSize = 0.3;
        particleSystem.maxSize = 0.5;
        // Life time of each particle (random between...
        particleSystem.minLifeTime = 2;
        particleSystem.maxLifeTime = 2;
        particleSystem.targetStopDuration = 2;

        // Emission rate
        particleSystem.emitRate = 500;
        particleSystem.createCylinderEmitter(1);

        /**
         * Adds a new life time gradient
         * @param gradient defines the gradient to use (between 0 and 1)
         * @param factor defines the life time factor to affect to the specified gradient
         * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
         * @returns the current particle system
         */
        particleSystem.addVelocityGradient(1, 1, 1); //start size at start of particle system

        particleSystem.updateSpeed = 0.1;
        // Start the particle system
        particleSystem.start();
        //////////////////////////////////////////////

        setTimeout(() => {
            particleSystem.dispose(true);
        }, 1000);
        //
    }

    public particule_fireball(source, target, color) {
        // play sound
        this._gamescene._sound.play("SOUND_fire_attack_1");

        // get local position
        let start = source.getPosition();
        let end = target.getPosition();

        // correct height
        start.y += 1;
        end.y += 1;

        // get mesh
        let mesh = target.mesh;

        // calculate angle
        var angle = Math.atan2(start.z - end.z, start.x - end.x);

        // create material
        var material = new StandardMaterial("player_spell");
        material.diffuseColor = this.colors[color][0];

        // create mesh
        var projectile = MeshBuilder.CreateSphere("Projectile", { segments: 4, diameter: 0.4 }, this._scene);
        projectile.material = material;
        projectile.position = start.clone();
        projectile.rotation.y = Math.PI / 2 - angle;

        //////////////////////////////////////////////
        // create particule trail
        var particleSystemTrail = new ParticleSystem("particles", 200, this._scene);
        particleSystemTrail.particleTexture = this.particleTxt_01.clone();
        particleSystemTrail.emitter = projectile; // the starting location
        // Colors of all particles
        particleSystemTrail.color1 = Color4.FromColor3(this.colors[color][0]);
        particleSystemTrail.color2 = Color4.FromColor3(this.colors[color][1]);
        particleSystemTrail.colorDead = new Color4(0, 0, 0, 0.0);
        // Size of each particle (random between...
        particleSystemTrail.minSize = 0.4;
        particleSystemTrail.maxSize = 0.6;
        // Life time of each particle (random between...
        particleSystemTrail.minLifeTime = 0.05;
        particleSystemTrail.maxLifeTime = 0.1;
        // Emission rate
        particleSystemTrail.emitRate = 1000;
        particleSystemTrail.createPointEmitter(new Vector3(-1, 0, -0), new Vector3(0, 0, 0));
        // Speed
        particleSystemTrail.minEmitPower = 1;
        particleSystemTrail.maxEmitPower = 2;
        //particleSystem.updateSpeed = 0.01;
        // Start the particle system
        particleSystemTrail.start();

        // create particule spray
        var particleSystem = new ParticleSystem("particles", 200, this._scene);
        particleSystem.particleTexture = this.particleTxt_01.clone();
        particleSystem.emitter = projectile; // the starting location
        // Colors of all particles
        particleSystem.color1 = Color4.FromColor3(this.colors[color][0]);
        particleSystem.color2 = Color4.FromColor3(this.colors[color][1]);
        particleSystem.colorDead = new Color4(0, 0, 0, 0.0);
        // Size of each particle (random between...
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        // Life time of each particle (random between...
        particleSystem.minLifeTime = 0.1;
        particleSystem.maxLifeTime = 0.3;
        // Emission rate
        particleSystem.emitRate = 50;
        particleSystem.createSphereEmitter(1);

        // Start the particle system
        particleSystem.start();

        //////////////////////////////////////////////

        //
        this.projectiles.set(nanoid(), {
            color: color,
            source: source,
            target: target,
            projectile: projectile,
            particleSystem: particleSystem,
            particleSystemTrail: particleSystemTrail,
        });

        /*
        projectile.lookAt(end);
        projectile.rotate(new Vector3(0, 1, 0), Tools.ToRadians(180));
        var endVector = projectile.calcMovePOV(0, 0, 72).addInPlace(projectile.position);
        var points = [start, endVector];
        var path = new Path3D(points);
        var i = 0;
        var loop = this._scene.onBeforeRenderObservable.add(() => {
            if (i < 1) {
                projectile.position = path.getPointAt(i);
                i += 0.005;
            }
            if (projectile.intersectsMesh(mesh, true) || i > 1) {
                this.particule_impact(mesh, color);
                projectile.dispose(true, true);
                particleSystem.dispose(true);
                particleSystemTrail.dispose(true);
                this._scene.onBeforeRenderObservable.remove(loop);
            }
        });
        */
    }
}
