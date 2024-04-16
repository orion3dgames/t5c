import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { PlayerInputs, ServerMsg } from "../../../shared/types";
import { NavMesh, Vector3 as Vector3Y } from "../../../shared/Libs/yuka-min";
import { Entity } from "../Entity";
import { Player } from "../Player";

export class EntityMove {
    private _node: Entity;
    private _mesh;
    private speed;
    private _navMesh: NavMesh;
    private _input;
    private _room;
    private _game;
    public playerInputs: PlayerInputs[] = [];
    private playerLatestSequence: number;

    private nextPosition: Vector3;
    private nextRotation: Vector3;

    private sequence: number = 0;

    private isCurrentPlayer: boolean;

    constructor(entity: Entity) {
        this._node = entity;
        this._input = entity._input;
        this._game = entity._game;
        this._mesh = entity.mesh;
        this._navMesh = entity._navMesh;
        this.speed = entity.speed;
        this.isCurrentPlayer = entity.isCurrentPlayer;
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

    // move transform node
    public tween() {
        // continuously lerp between current position and next position
        this._node.position = Vector3.Lerp(this._node.position, this.nextPosition, 0.15);

        // move camera at the same time
        if (this._node.isCurrentPlayer) {
            this._node.cameraController._camRoot.position = Vector3.Lerp(this._node.cameraController._camRoot.position, this.nextPosition, 0.15);
        }

        // rotation
        // TODO DAYD : make it better
        // maybe look into Scalar.LerpAngle ??? https://doc.babylonjs.com/typedoc/classes/BABYLON.Scalar#LerpAngle
        const gap = Math.abs(this._node.rotation.y - this.nextRotation.y);
        if (gap > Math.PI) this._node.rotation.y = this.nextRotation.y;
        else this._node.rotation = Vector3.Lerp(this._node.rotation, this.nextRotation, 0.45);
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
            let sourcePos = new Vector3Y(oldX, oldY, oldZ); // new pos
            let destinationPos = new Vector3Y(newX, newY, newZ); // new pos
            const foundPath = this._navMesh.getRegionForPoint(destinationPos, 0.5);
            if (foundPath) {
                // adjust height of the entity according to the ground
                let currentRegion = foundPath;
                const distance = currentRegion.plane.distanceToPoint(destinationPos);
                newY -= distance; // smooth transition*/

                this.nextPosition.x = newX;
                this.nextPosition.y = newY;
                this.nextPosition.z = newZ;
                this.nextRotation.y = this.nextRotation.y + (newRotY - this.nextRotation.y);
            }
        }
    }

    //
    public processMove() {
        // detect movement
        if (this._input.player_can_move && !this._node.blocked) {
            // increment seq
            this.sequence++;

            // prepare input to be sent
            let latestInput = {
                seq: this.sequence,
                h: this._input.horizontal,
                v: this._input.vertical,
            };

            // sent current input to server for processing
            this._game.sendMessage(ServerMsg.PLAYER_MOVE, latestInput);

            // do client side prediction
            this.predictionMove(latestInput);
        }
    }
}
