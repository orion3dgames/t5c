import { Schema, type } from "@colyseus/schema";
import { PlayerCurrentState } from "../../../shared/Entities/Player/PlayerCurrentState";
import { Vector3 } from "yuka";

export class EntityState extends Schema {

  // id and name
  @type("number") id: number = 0;
  @type('string') public sessionId: string;
  @type("string") public name: string = "";
  @type("string") public type: string = ""; // type of entity: rat, bat, etc..

  // position & rotation
  @type('string') public location: string;
  @type('number') public x: number;
  @type('number') public y: number;
  @type('number') public z: number;
  @type('number') public rot: number;

  // entity details
  @type('number') public health: number;
  @type('number') public level: number;

  // flags
  @type('boolean') public blocked: boolean; // if true, used to block player and to prevent movement
  @type('number') public state: PlayerCurrentState = PlayerCurrentState.IDLE;

  public _gameroom;
  public currentRegion;
  public toRegion;
  public destinationPath;
  public config;

  constructor(_gameroom, ...args: any[]) {
		super(args);

    this._gameroom = _gameroom;

    this.spawn(args);
	}

  spawn(args){

  }

  /**
   * Manually set entity position & rotation
   * @param x 
   * @param y 
   * @param z 
   * @param rot 
   */
  setPositionManual(x:number, y:number, z:number, rot:number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.rot = rot;
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

}
