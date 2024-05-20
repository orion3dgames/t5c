import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { generateRandomId, randomNumberInRange } from "../../../shared/Utils";
import { Entity } from "../Entity";

export class EntityUtils {
    private _scene: Scene;
    private damageBubbles: any = [];

    private font_size = 30;
    private font = "bold 30px Arial";

    constructor(scene: Scene) {
        this._scene = scene;
    }

    getWidthForDynamicTexture(text: string): number {
        var temp = new DynamicTexture("TempDamageTexture", 64, this._scene);
        var tmpctx = temp.getContext();
        tmpctx.font = this.font;
        var DTWidth = tmpctx.measureText(text).width + 8;
        temp.dispose();
        return DTWidth;
    }

    addDamage(entity: Entity) {
        // only proceed if damage has occured
        let healthChange = entity.entity.health - entity.health;
        if (healthChange === 0 || healthChange === 1) {
            return false;
        }

        // set a few vars
        let uuid = generateRandomId();
        let color = healthChange > 0 ? Color3.Green().toHexString() : Color3.Yellow().toHexString(); // set current color
        var planeHeight = 0.4; //Set height for plane
        var DTHeight = 1.5 * this.font_size; //Set height for dynamic textur
        var ratio = planeHeight / DTHeight; //Calcultae ratio
        var text = "" + healthChange; //Set text

        //Use a temporay dynamic texture to calculate the length of the text on the dynamic texture canvas
        var DTWidth = this.getWidthForDynamicTexture(text);

        //Calculate width the plane has to be
        var planeWidth = DTWidth * ratio;

        //Create dynamic texture and write the text
        var dynamicTexture = new DynamicTexture("DamageTexture_" + uuid, { width: DTWidth, height: DTHeight }, this._scene);

        // create material
        var mat = new StandardMaterial("DamageMat_" + uuid, this._scene);
        mat.diffuseTexture = dynamicTexture;
        mat.opacityTexture = dynamicTexture;
        mat.disableLighting = true; // dont let lighting affect the mesh
        mat.emissiveColor = Color3.White(); // material to be fully "lit"

        // create plane
        var healthBar = MeshBuilder.CreatePlane(
            "DamagePlane_" + uuid,
            { width: planeWidth, height: planeHeight, sideOrientation: Mesh.DOUBLESIDE },
            this._scene
        );
        healthBar.position = entity.position.clone();
        healthBar.position.y = healthBar.position.y + 3;
        healthBar.billboardMode = Mesh.BILLBOARDMODE_ALL;
        healthBar.parent = entity.meshController.namePlateAnchor;
        healthBar.material = mat;

        // draw text
        dynamicTexture.drawText(text, null, null, this.font, color, "transparent", true);

        // set meta
        healthBar.metadata = {
            end_position: entity.position.y + 5,
            material: mat,
            texture: dynamicTexture,
            offset: randomNumberInRange(-0.002, 0.002),
        };

        // add to damage bubbles array
        this.damageBubbles.push(healthBar);
    }

    update() {
        // update damage bubbles
        if (this.damageBubbles.length > 0) {
            // loop through damage bubbles and update them
            for (let i = 0; i < this.damageBubbles.length; i++) {
                let metadata = this.damageBubbles[i].metadata;
                this.damageBubbles[i].position.y += 0.04;
                this.damageBubbles[i].position.z += metadata.offset;
                this.damageBubbles[i].position.x += metadata.offset;
                this.damageBubbles[i].visibility -= 0.02;

                // if higher than end position, remove
                if (this.damageBubbles[i].position.y > this.damageBubbles[i].metadata.end_position) {
                    // dispose texture
                    if (this.damageBubbles[i].metadata.material) {
                        this.damageBubbles[i].metadata.material.dispose();
                    }

                    // dispose material
                    if (this.damageBubbles[i].metadata.texture) {
                        this.damageBubbles[i].metadata.texture.dispose();
                    }

                    // dispose mesh
                    this.damageBubbles[i].dispose();
                    this.damageBubbles.splice(i, 1);
                    i--;
                }
            }
        }
    }
}
