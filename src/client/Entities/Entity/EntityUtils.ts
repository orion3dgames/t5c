import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";

export class EntityUtils {
    private _scene: Scene;

    private damageBubbles: any = [];

    constructor(scene: Scene) {
        this._scene = scene;
    }

    showDamageBubble(damage: number, entity) {
        // create simple mesh
        var mesh = MeshBuilder.CreateGround("b", { width: 1, height: 1 }, this._scene);

        // create dynamic texture
        var textureGround = new DynamicTexture("dynamic texture", { width: 256, height: 256 }, this._scene);

        // create material
        var materialGround = new StandardMaterial("Mat", this._scene);
        materialGround.diffuseTexture = textureGround;
        mesh.material = materialGround;

        //Add text to dynamic texture
        var font = "bold 200px arial";
        textureGround.drawText("" + damage, 75, 135, font, "black", "white", true, true);

        // set position
        let start_position = entity.position.y + 1;

        mesh.rotation.x = Math.PI / 2;
        mesh.position.x = entity.position.x;
        mesh.position.y = start_position;
        mesh.position.z = entity.position.z;
        mesh.billboardMode = 4;
        mesh.metadata = {
            damage: damage,
            entity: entity,
            start_position: start_position,
            end_position: entity.position.y + 10,
        };

        // add to damage bubbles array
        this.damageBubbles.push(mesh);

        console.log("creating danage bubbles");
    }

    update() {
        // update damage bubbles
        if (this.damageBubbles.length > 0) {
            for (let i = 0; i < this.damageBubbles.length; i++) {
                this.damageBubbles[i].position.y += 0.05;
                if (this.damageBubbles[i].position.y > this.damageBubbles[i].metadata.end_position) {
                    this.damageBubbles[i].dispose();
                    this.damageBubbles.splice(i, 1);
                    i--;
                }
            }
        }
    }
}
