import { Vector3 } from "@babylonjs/core";
import Config from "../../Config";
import { PlayerInputs } from "../../types";

export class PlayerMove {

    private _mesh;
    public playerInputs = [];
    private playerLatestSequence: number;

    private nextPosition: Vector3;
    private nextRotation: Vector3;

    constructor(mesh) {
        this._mesh = mesh;
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
        if (!this.playerInputs.length) return false

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
    public predictionMove(latestInput:PlayerInputs){

        // move player locally
        this.move(latestInput);

        // Save this input for later reconciliation.
        this.playerInputs.push(latestInput);
    }

    public tween(){
        if(this._mesh){
            this._mesh.position = Vector3.Lerp(this._mesh.position, this.nextPosition, 0.2);
            this._mesh.rotation = Vector3.Lerp(this._mesh.rotation, this.nextRotation, 0.8);
        }
    }

    public move(input:PlayerInputs):void {
        let rotationY = Math.atan2(input.h, input.v);
        this.nextPosition.x -= input.h * Config.PLAYER_SPEED;
        this.nextPosition.z -= input.v * Config.PLAYER_SPEED;
        this.nextRotation.y = this.nextRotation.y + (rotationY - this.nextRotation.y);
    }

}