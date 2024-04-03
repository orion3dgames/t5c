import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { PlayerInputs, ServerMsg } from "../../../shared/types";
import { NavMesh, Vector3 as Vector3Y } from "../../../shared/Libs/yuka-min";
import { Entity } from "../Entity";

export class EntityMove {
    private _player;
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

    constructor(player: Entity) {
        this._player = player;
        this._mesh = player.mesh;
        this._navMesh = player._navMesh;
        this._input = player._input;
        this._room = player._room;
        this._game = player._game;
        (this.isCurrentPlayer = player.isCurrentPlayer), (this.speed = player.speed);
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

    //
    public processMove() {
        // detect movement
        if (this._input.player_can_move && !this._player.blocked) {
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

    // move transform node
    public tween() {
        // continuously lerp between current position and next position
        this._player.position = Vector3.Lerp(this._player.position, this.nextPosition, 0.15);

        // rotation
        // TODO DAYD : make it better
        // maybe look into Scalar.LerpAngle ??? https://doc.babylonjs.com/typedoc/classes/BABYLON.Scalar#LerpAngle
        const gap = Math.abs(this._player.rotation.y - this.nextRotation.y);
        if (gap > Math.PI) this._player.rotation.y = this.nextRotation.y;
        else this._player.rotation = Vector3.Lerp(this._player.rotation, this.nextRotation, 0.45);

        // test
        //this._mesh.position = Vector3.Lerp(this._node.position, this.nextPosition, 0.1);
        //this._mesh.rotation = Vector3.Lerp(this._node.rotation, this.nextRotation, 0.45);
    }

    public move(input: PlayerInputs): void {
        if (this.isCurrentPlayer) {
            //
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
            let destinationPos = new Vector3Y(newX, newY, newZ); // new pos
            const foundPath = this._navMesh.getRegionForPoint(destinationPos, 0.5);
            if (foundPath) {
                // adjust height of the entity according to the ground
                let currentRegion = foundPath;
                if (currentRegion && currentRegion.plane) {
                    const distance = currentRegion.plane.distanceToPoint(destinationPos);
                    newY -= distance; // smooth transition*/
                }

                this.nextPosition.x = newX;
                this.nextPosition.y = newY;
                this.nextPosition.z = newZ;
                this.nextRotation.y = this.nextRotation.y + (newRotY - this.nextRotation.y);
            }
        }
    }
}
