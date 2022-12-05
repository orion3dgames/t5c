import { Schema, type } from "@colyseus/schema";
import { Client } from "@colyseus/core";
import Logger from "../../../shared/Logger";
import Config from "../../../shared/Config";
import { PlayerInputs } from "../../../shared/types";

export class PlayerState extends Schema {

  // id and name
  @type("number") id: number = 0;
  @type('string') public sessionId: string;
  @type("string") public name: string = "";

  // position & rotation
  @type("number") public sequence: number = 0; // latest input sequence
  @type('number') public x: number;
  @type('number') public y: number;
  @type('number') public z: number;
  @type('number') public rot: number;

  @type('number') public health: number;
  @type('number') public level: number;
  @type('number') public experience: number;

  // current player zone
  @type("string") public location: string = "";

  private _navmesh;
  private _database;

  constructor(navmesh, database, ...args: any[]) {
		super(args);
    this._navmesh = navmesh;
    this._database = database;
	}

  setLocation(location) {
      this.location = location;
  }

  setPositionManual(x, y, z, rot) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.rot = rot;
  }


  loseHealth(amount:number) {
    this.health -= amount;
  }

  processPlayerInput(playerInput:PlayerInputs) {

      // save current position
      let oldX = this.x;
      let oldZ = this.z;
      let oldRot = this.rot;

      // calculate new position
      let newX = this.x - (playerInput.h * Config.PLAYER_SPEED);
      let newZ = this.z - (playerInput.v * Config.PLAYER_SPEED);
      let newRot = Math.atan2(playerInput.h, playerInput.v);

      // check it fits in navmesh
      const foundPath: any = this._navmesh.findPath({ x: this.x, y: this.z }, { x: newX, y: newZ });
      if (foundPath && foundPath.length > 0) {

          // next position validated, update player
          this.x = newX;
          this.y = 0;
          this.z = newZ;
          this.rot = newRot;
          this.sequence = playerInput.seq;

          // add player to server
          Logger.info('Valid position for '+this.name+': ( x: '+this.x+', y: '+this.y+', z: '+this.z+', rot: '+this.rot);

      } else {

          // collision detected, return player old position
          this.x = oldX;
          this.y = 0;
          this.z = oldZ;
          this.rot = oldRot;
          this.sequence = playerInput.seq;

          Logger.warning('Invalid position for '+this.name+': ( x: '+this.x+', y: '+this.y+', z: '+this.z+', rot: '+this.rot);
      }
  }

}
