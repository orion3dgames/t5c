import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { generateRandomId, randomNumberInRange } from "../../../shared/Utils";
import { Entity } from "../Entity";
import { Item } from "../Item";

export class EntityUtils {
    private _scene: Scene;
    private damageBubbles: any = [];
    private font_size = 30;
    private font = "bold 30px Arial";
    private entity_height: number = 3;

    constructor(scene: Scene) {
        this._scene = scene;
    }

    /**
     * Returns the width of a dynamic texture for the provided text
     * @param text
     * @returns
     */
    getWidthForDynamicTexture(text: string): number {
        var temp = new DynamicTexture("TempDamageTexture", 64, this._scene);
        var tmpctx = temp.getContext();
        tmpctx.font = this.font;
        var DTWidth = tmpctx.measureText(text).width + 8;
        temp.dispose();
        return DTWidth;
    }

    /**
     * Create a material with a dynamic texture the size of the provided text
     * @param height =
     * @param t_height
     * @param text
     * @returns
     */
    createMaterial(height = 0.3, t_height = 1.5, text = "Hello World") {
        // set a few vars
        let uuid = generateRandomId(6);
        var planeHeight = height; //Set height for plane
        var DTHeight = t_height * this.font_size; //Set height for dynamic textur
        var ratio = planeHeight / DTHeight; //Calculate ratio
        var text = "" + text; //Set text

        //Use a temporay dynamic texture to calculate the length of the text on the dynamic texture canvas
        var DTWidth = this.getWidthForDynamicTexture(text);

        //Calculate width the plane has to be
        var planeWidth = DTWidth * ratio;

        //Create dynamic texture and write the text
        var texture = new DynamicTexture("UI_Nameplate_Txt_" + uuid, { width: DTWidth, height: DTHeight }, this._scene);

        // create material
        var material = new StandardMaterial("UI_Nameplate_Mat_" + uuid, this._scene);
        material.diffuseTexture = texture;
        material.opacityTexture = texture;
        material.disableLighting = true; // dont let lighting affect the mesh
        material.emissiveColor = Color3.White(); // material to be fully "lit"

        return {
            uuid,
            planeWidth,
            planeHeight,
            texture,
            material,
        };
    }

    /**
     * Draw on dynamic texture
     * @param text
     * @param texture
     * @param color
     */
    drawDynamicTexture(text, texture, color = "#FFFFFF") {
        texture.drawText(text, null, null, this.font, color, "transparent", true);
    }

    /**
     * Draw nameplate above entity
     * @param entity
     */
    addNamePlate(entity, entity_height = 3) {
        let text = entity.name;

        // if entity is a spawn, we can use instances as they all have the same name.
        let isSpawn = entity.spawnInfo ?? false;
        if (isSpawn) {
            // if raw mesh does not exists, create it
            if (!entity._game.instances.get(isSpawn.key)) {
                // create raw mesh
                let { planeWidth, planeHeight, texture, material } = this.createMaterial(0.3, 1.5, text);
                var plane = MeshBuilder.CreatePlane(
                    "RawNamePlate_" + isSpawn.key,
                    { width: planeWidth, height: planeHeight, sideOrientation: Mesh.DOUBLESIDE },
                    this._scene
                );
                plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
                plane.material = material;
                plane.setEnabled(false); // hide raw mesh

                // draw text
                this.drawDynamicTexture(text, texture);

                // save raw mesh for later use
                entity._game.instances.set(isSpawn.key, plane);
            }

            // get raw mesh
            let rawMesh = entity._game.instances.get(isSpawn.key);

            // create instance
            let uuid = generateRandomId(6);
            let instance = rawMesh.createInstance("namePlate_" + isSpawn.key + "_" + uuid);
            instance.parent = entity.mesh;
            instance.position.y = instance.position.y + entity_height;
        } else {
            // else we create a unique mesh
            // todo: probably can do something better here
            let { planeWidth, planeHeight, texture, material } = this.createMaterial(0.3, 1.5, text);
            var plane = MeshBuilder.CreatePlane(
                "namePlate_" + entity.name,
                { width: planeWidth, height: planeHeight, sideOrientation: Mesh.DOUBLESIDE },
                this._scene
            );
            plane.parent = entity.mesh;
            plane.position.y = plane.position.y + this.entity_height;
            plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
            plane.material = material;

            // draw text
            this.drawDynamicTexture(text, texture);
        }
    }

    /**
     * Draw damage bubble above entity
     * @param entity
     */
    addDamageBubble(entity: Entity) {
        // only proceed if damage has occured
        let healthChange = entity.entity.health - entity.health;
        if (healthChange === 0 || healthChange === 1) {
            return false;
        }

        let text = "" + healthChange;
        let color = healthChange > 0 ? Color3.Green().toHexString() : Color3.Yellow().toHexString(); // set current color
        let { planeWidth, planeHeight, texture, material } = this.createMaterial(0.4, 1.5, text);

        // create plane
        let uuid = generateRandomId(6);
        var plane = MeshBuilder.CreatePlane("damageBubble_" + uuid, { width: planeWidth, height: planeHeight, sideOrientation: Mesh.DOUBLESIDE }, this._scene);
        plane.parent = entity.mesh;
        plane.position.y = plane.position.y + this.entity_height;
        plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
        plane.material = material;

        // draw text
        this.drawDynamicTexture(text, texture, color);

        // set meta
        plane.metadata = {
            end_position: entity.position.y + 6,
            material: material,
            texture: texture,
            offset: randomNumberInRange(-0.002, 0.002),
        };

        // add to damage bubbles array
        this.damageBubbles.push(plane);
    }

    /**
     * Update Loop
     */
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
