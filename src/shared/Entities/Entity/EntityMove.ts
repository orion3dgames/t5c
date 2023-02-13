import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import Config from "../../Config";
import { PlayerInputs } from "../../types";
import { NavMesh, Vector3 as Vector3Y } from "../../yuka";

export class EntityMove {
    private _mesh;
    private speed;
    private _navMesh: NavMesh;
    public playerInputs = [];
    private playerLatestSequence: number;

    private nextPosition: Vector3;
    private nextRotation: Vector3;

    private isCurrentPlayer: boolean;

    constructor(mesh, navMesh: NavMesh, isCurrentPlayer, speed) {
        this._mesh = mesh;
        this._navMesh = navMesh;
        this.speed = speed;
        this.isCurrentPlayer = isCurrentPlayer;
    }

    public getNextPosition() {
        return this.nextPosition;
    }

    public getNextRotation() {
        return this.nextRotation;
    }

    public setPositionAndRotation(entity): void {
        this.nextPosition = new Vector3(entity.x, entity.y, entity.z);
        this.nextRotation = new Vector3(0, entity.rot, 0);
    }

    // server Reconciliation. Re-apply all the inputs not yet processed by the server
    public reconcileMove(latestSequence) {
        // store latest sequence processed by server
        this.playerLatestSequence = latestSequence;

        // if nothing to apply, do nothin
        if (!this.playerInputs.length) return false;

        var j = 0;
        while (j < this.playerInputs.length) {
            var nextInput = this.playerInputs[j];

            if (nextInput.seq <= this.playerLatestSequence) {
                // Already processed. Its effect is already taken into account into the world update
                // we just got, so we can drop it.
                this.playerInputs.splice(j, 1);
            } else {
                // Not processed by the server yet. Re-apply it.
                this.move(nextInput);
                j++;
            }
        }
    }

    // prediction move
    public predictionMove(latestInput: PlayerInputs) {
        // move player locally
        this.move(latestInput);

        // Save this input for later reconciliation.
        this.playerInputs.push(latestInput);
    }

    public tween() {
        this._mesh.position = Vector3.Lerp(this._mesh.position, this.nextPosition, 0.15);
        const gap = Math.abs(this._mesh.rotation.y - this.nextRotation.y);
        // TODO DAYD : make it better
        // maybe look into Scalar.LerpAngle ??? https://doc.babylonjs.com/typedoc/classes/BABYLON.Scalar#LerpAngle
        if (gap > Math.PI) this._mesh.rotation.y = this.nextRotation.y;
        else this._mesh.rotation = Vector3.Lerp(this._mesh.rotation, this.nextRotation, 0.2);
    }

    public move(input: PlayerInputs): void {
        let speed = this.speed;

        // save current position
        let oldX = this.nextPosition.x;
        let oldY = this.nextPosition.y;
        let oldZ = this.nextPosition.z;

        // calculate new position
        let newX = oldX - input.h * speed;
        let newY = oldY;
        let newZ = oldZ - input.v * speed;
        const newRotY = Math.atan2(input.h, input.v);
        // check it fits in navmesh
        if (this.isCurrentPlayer) {
            let sourcePos = new Vector3(oldX, oldY, oldZ); // new pos
            let destinationPos = new Vector3(newX, newY, newZ); // new pos
            const foundPath: any = this._navMesh.checkPath(sourcePos, destinationPos);
            if (foundPath) {
                this.nextPosition.x = newX;
                this.nextPosition.y = newY;
                this.nextPosition.z = newZ;
                this.nextRotation.y = this.nextRotation.y + (newRotY - this.nextRotation.y);

                //console.log('VALID position for', new Vector3Y( oldX, oldY, oldZ), new Vector3Y(newX, newY, newZ), foundPath);
            } else {
                //console.error('INVALID position for', new Vector3Y( oldX, oldY, oldZ), new Vector3Y(newX, newY, newZ, foundPath));
            }
        } else {
            // not current player, just move straight away
            this.nextPosition.x = newX;
            this.nextPosition.y = newY;
            this.nextPosition.z = newZ;
            this.nextRotation.y = this.nextRotation.y + (newRotY - this.nextRotation.y);

            //console.log('entity move');
        }
    }
}
