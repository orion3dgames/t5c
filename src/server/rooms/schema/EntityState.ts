import { Schema, type } from "@colyseus/schema";
import Logger from "../../../shared/Logger";
import Config from "../../../shared/Config";
import { PlayerInputs } from "../../../shared/types";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { NavMesh, Vector3 } from "yuka";

export class EntityState extends Schema {

  // id and name
  @type("number") id: number = 0;
  @type('string') public sessionId: string;
  @type("string") public name: string = "";
  @type("string") public type: string = "player";
  @type("string") public race: string = "player_hobbit";

  // position & rotation
  @type("string") public location: string = "";
  @type("number") public sequence: number = 0; // latest input sequence
  @type('number') public x: number = 0;
  @type('number') public y: number = 0;
  @type('number') public z: number = 0;
  @type('number') public rot: number = 0;

  // player details
  @type('number') public health: number = 0;
  @type('number') public level: number = 0;
  @type('number') public experience: number = 0;

  // flags
  @type('boolean') public blocked: boolean = false; // if true, used to block player and to prevent movement
  @type('number') public state: EntityCurrentState = EntityCurrentState.IDLE;

  public _navMesh:NavMesh;
  public _gameroom;
  public currentRegion;
  public toRegion;
  public destinationPath;
  public config;

  // AI
  public AI_CURRENT_STATE:number = 0;
  public AI_STATE_REMAINING_DURATION:number = 0;

  constructor(gameroom, ...args: any[]) {
		super(args);
    this._navMesh = gameroom.navMesh;
    this._gameroom = gameroom;
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

  setRandomDestination(currentPos:Vector3):void{
    this.toRegion = this._gameroom.navMesh.getRandomRegion();
    this.destinationPath = this._gameroom.navMesh.findPath(
        currentPos,
        this.toRegion.centroid
    );
    if(this.destinationPath.length === 0){
      this.toRegion = false;
      this.destinationPath = false;
    }
  }

  loseHealth(amount:number) {
    this.health -= amount;
  }

  canMoveTo(sourcePos:Vector3, newPos:Vector3){
    return this._navMesh.checkPath(sourcePos, newPos);
  }

  processPlayerInput(playerInput:PlayerInputs) {

      if(this.blocked){
        this.state = EntityCurrentState.IDLE;
        Logger.warning('Player '+this.name+' is blocked, no movement will be processed');
        return false;
      }

      // cancel any moveTo event
      this.toRegion = false;
      this.destinationPath = [];

      // save current position
      let oldX = this.x;
      let oldY = this.y;
      let oldZ = this.z;
      let oldRot = this.rot;

      // calculate new position
      let newX = this.x - (playerInput.h * Config.PLAYER_SPEED);
      let newY = this.y;
      let newZ = this.z - (playerInput.v * Config.PLAYER_SPEED);
      let newRot = Math.atan2(playerInput.h, playerInput.v);

      // check if destination is in navmesh
      let sourcePos = new Vector3(oldX, oldY, oldZ); // new pos
      let destinationPos = new Vector3(newX, newY, newZ); // new pos
      const foundPath: any = this._navMesh.checkPath(sourcePos, destinationPos);
      if (foundPath){

          // next position validated, update player
          this.x = newX;
          this.y = 0;
          this.z = newZ;
          this.rot = newRot;
          this.sequence = playerInput.seq;
          //this.state = EntityCurrentState.WALKING;

          // add player to server
          Logger.info('Valid position for '+this.name+': ( x: '+this.x+', y: '+this.y+', z: '+this.z+', rot: '+this.rot);

      } else {

          // collision detected, return player old position
          this.x = oldX;
          this.y = 0;
          this.z = oldZ;
          this.rot = oldRot;
          this.sequence = playerInput.seq;
          //this.state = EntityCurrentState.IDLE;

          Logger.warning('Invalid position for '+this.name+': ( x: '+this.x+', y: '+this.y+', z: '+this.z+', rot: '+this.rot);
      }
      
  }

  calculateRotation(v1, v2){
    return Math.atan2(v1.x - v2.x, v1.z - v2.z);
  }

  /**
   * Move entity toward a Vector3 position
   * @param source
   * @param destination 
   * @param speed 
   * @returns 
   */
  moveTo(source: Vector3, destination: Vector3, speed:number):Vector3{

    let currentX = source.x;
    let currentZ = source.z;
    let targetX = destination.x;
    let targetZ = destination.z;
    let newPos = new Vector3(source.x, source.y, source.z);

    if(targetX < currentX){
        newPos.x -= speed;
        if(newPos.x < targetX){
            newPos.x = targetX;
        }
    }

    if(targetX > currentX){
        newPos.x += speed;
        if(newPos.x > targetX){
            newPos.x = targetX;
        }
    }

    if(targetZ < currentZ){
        newPos.z -= speed;
        if(newPos.z < targetZ){
            newPos.z = targetZ;
        }
    }

    if(targetZ > currentZ){
        newPos.z += speed;
        if(newPos.z > targetZ){
            newPos.z = targetZ;
        }
    }

    return newPos;

  }

}
