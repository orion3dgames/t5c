import { Vector3 } from "@babylonjs/core";
import Config from "../../Config";
import { PlayerInputs } from "../../types";
import { NavMesh, Vector3 as Vector3Y } from "yuka";

export class PlayerMove {

    private _mesh;
    private _navMesh:NavMesh;
    public playerInputs = [];
    private playerLatestSequence: number;

    private nextPosition: Vector3;
    private nextRotation: Vector3;

    private isCurrentPlayer: boolean;

    constructor(mesh, navMesh:NavMesh, isCurrentPlayer) {
        this._mesh = mesh;
        this._navMesh = navMesh
        this.isCurrentPlayer = isCurrentPlayer
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

        if(!this._mesh){
            return false;
        }

        this._mesh.position = Vector3.Lerp(this._mesh.position, this.nextPosition, 0.2);
        this._mesh.rotation = Vector3.Lerp(this._mesh.rotation, this.nextRotation, 0.8);
    }

    public move(input:PlayerInputs):void {

        // save current position
        let oldX = this.nextPosition.x;
        let oldY = this.nextPosition.y;
        let oldZ = this.nextPosition.z;

        // calculate new position
        let newX = oldX - (input.h * Config.PLAYER_SPEED);
        let newY = oldY;
        let newZ = oldZ - (input.v * Config.PLAYER_SPEED);
        let newRot = Math.atan2(input.h, input.v);

        // check it fits in navmesh
        if(this.isCurrentPlayer){

            let destinationPos = new Vector3(newX, newY, newZ); // new pos
            const foundPath: any = this._navMesh.getRegionForPoint(destinationPos);
            if (foundPath){
                this.nextPosition.x = newX;
                this.nextPosition.y = newY;
                this.nextPosition.z = newZ;
                this.nextRotation.y = this.nextRotation.y + (newRot - this.nextRotation.y);
                console.log('VALID position for', new Vector3Y( oldX, oldY, oldZ), new Vector3Y(newX, newY, newZ), foundPath);
            }else{
                console.error('INVALID position for', new Vector3Y( oldX, oldY, oldZ), new Vector3Y(newX, newY, newZ, foundPath));
            }
            
        }else{

            // not current player, just move straight away
            this.nextPosition.x = newX;
            this.nextPosition.y = newY;
            this.nextPosition.z = newZ;
            this.nextRotation.y = this.nextRotation.y + (newRot - this.nextRotation.y);

        }

    }

}