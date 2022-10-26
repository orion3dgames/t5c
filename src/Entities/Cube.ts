import { TransformNode, MeshBuilder } from "@babylonjs/core";

export class Cube extends TransformNode {
    entity: any;
    constructor(entity, scene) {
        super("cube", scene);
        this.entity = entity;
        this.spawn(entity, scene);
    }
    private spawn(entity, scene): void {
        // generate mesh
        const mesh = MeshBuilder.CreateBox(`cube-${this.entity.id}`, scene);

        // set initial position from server
        mesh.position.set(this.entity.x, this.entity.y, this.entity.z);
    }
}