import { Schema, type } from "@colyseus/schema";
import Logger from "../../../shared/Logger";
import Config from "../../../shared/Config";
import { PlayerInputs } from "../../../shared/types";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { AI_STATE } from "../../../shared/Entities/Entity/AIState";
import { NavMesh, Vector3 } from "../../../shared/yuka";

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
  public raceData;

  // AI
  @type('number') public AI_CURRENT_STATE:AI_STATE = 0;
  public AI_STATE_REMAINING_DURATION:number = 0;

  public AI_CLOSEST_PLAYER_POSITION = new Vector3(0, 0, 0);
  public AI_CLOSEST_PLAYER_DISTANCE = null;
  public AI_CLOSEST_PLAYER = null;

  constructor(gameroom, ...args: any[]) {
		super(args);
    this._navMesh = gameroom.navMesh;
    this._gameroom = gameroom;
    this.raceData = Config.entities[this.race];
	}

  setLocation(location:string):void {
      this.location = location;
  }

  setPosition(updatedPos:Vector3):void{
    this.x = updatedPos.x;
    this.y = updatedPos.y;
    this.z = updatedPos.z;
  }

  loseHealth(amount:number) {
    this.health -= amount;
  }

  /*
  var closestIndex : int =0;
var closestDistance : float = 100000 //something big
for (var i=0; i<MagnetPoints.Length; i++){
  var distance : float = (transform.position - MagnetPoints[i]).magnitude;
  //You can use sqrMagnitude for a slightly faster calculation, if you do not actually need to know the distance, only which one is smallest
 
  if(distance < closestDistance){
    closestDistance = distance;
    closestIndex = i;
  }
}*/

  // 
  updateBrain(){

    //
    let closestPlayer = null;
    let closestDistance = 1000000;
    this._gameroom.state.entities.forEach(entity => {

      // only for entity 
      if(this.type === 'entity' && entity.type === 'player' ){

        // entity must always know the closest player at all times
        let playerPos = new Vector3(entity.x, entity.y, entity.z);
        let entityPos = new Vector3(this.x, this.y, this.z);
        let distanceBetween = entityPos.distanceTo(playerPos);
        if(distanceBetween < closestDistance){
          console.log('CLOSEST PLAYER FROM '+this.name+' IS NOW', closestDistance, distanceBetween, entity.name);
          closestDistance = distanceBetween;
          this.AI_CLOSEST_PLAYER_POSITION = new Vector3(entity.x, entity.y, entity.z);
          this.AI_CLOSEST_PLAYER_DISTANCE = distanceBetween;
          this.AI_CLOSEST_PLAYER = entity;
        }
      }
 
    });


    if(this.type === 'entity' ){

      this.AI_CURRENT_STATE === AI_STATE.IDLE;

      // if player in range, start chasing
      if(this.AI_CLOSEST_PLAYER_DISTANCE != null && this.AI_CLOSEST_PLAYER_DISTANCE < 6){
        this.AI_CURRENT_STATE = AI_STATE.SEEKING;
        console.log('FOUND PLAYER. CHASING MODE ON', this.AI_CLOSEST_PLAYER.name);

        if(this.AI_CLOSEST_PLAYER_DISTANCE < 2){
          console.log('CLOSE ENOUGHT TO PLAYER. ATTACK MODE ON', this.AI_CLOSEST_PLAYER.name);
          this.AI_CURRENT_STATE = AI_STATE.ATTACKING;
          this.state = EntityCurrentState.ATTACK;
          this.AI_CLOSEST_PLAYER.loseHealth(20);
        }

      }


      if(this.AI_CLOSEST_PLAYER_DISTANCE != null && this.AI_CLOSEST_PLAYER_DISTANCE > 6){
        console.log('TOO FAR FROM PLAYER. WANDER MODE ON');
        this.AI_CURRENT_STATE = AI_STATE.WANDER;
      }

      if(this.health < 0 || this.health === 0){
        console.log('DEAD. IDLE MODE ON');
        this.AI_CURRENT_STATE = AI_STATE.IDLE;
        this.state = EntityCurrentState.DEAD;
      }

      console.log('CURRENT STATE', this.AI_CURRENT_STATE);

    }

  }

  /**
   * SEEK BEHAVIOUR
   */
  seek(){
    console.log('SEEKING...')

    // save current position
    let currentPos = new Vector3(this.x, this.y,this.z);

    // calculate next position towards destination
    let updatedPos = this.moveTo(currentPos, this.AI_CLOSEST_PLAYER_POSITION, this.raceData.speed);
    this.setPosition(updatedPos);

    // calculate rotation
    this.rot = this.calculateRotation(currentPos, updatedPos);

  }

  /**
   * WANDER BEHAVIOUR
   */
  wander(){
    console.log('wander...')
    // save current position
    let currentPos = new Vector3(this.x, this.y,this.z);

    // if entity does not have a destination, find one
    if(!this.toRegion){
      this.setRandomDestination(currentPos);
    }

    // move entity
    if(this.destinationPath.length > 0){

        // get next waypoint
        let destinationOnPath = this.destinationPath[0];
        destinationOnPath.y = 0;
  
        // calculate next position towards destination
        let updatedPos = this.moveTo(currentPos, destinationOnPath, this.raceData.speed);
        this.setPosition(updatedPos);

        // calculate rotation
        this.rot = this.calculateRotation(currentPos, updatedPos);

        // check if arrived at waypoint
        if(destinationOnPath.equals(updatedPos)){
          this.destinationPath.shift();
        }


    }else{

        // something is wrong, let's look for a new destination
        this.resetDestination();

    }

  }

  /**
   * Finds a new random valid position on navmesh and sets is as the new destination for this entity
   * @param {Vector3} currentPos
   */
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

  resetDestination():void{
    this.toRegion = false;
    this.destinationPath = false;
  }

  /**
   * Check if player can move from sourcePos to newPos
   * @param {Vector3} sourcePos source position
   * @param {Vector3} newPos destination position
   * @returns boolean
   */
  canMoveTo(sourcePos:Vector3, newPos:Vector3):boolean{
    return this._navMesh.checkPath(sourcePos, newPos);
  }

  /**
   * Calculate next forward position on the navmesh based on playerInput forces
   * @param {PlayerInputs} playerInput 
   * @returns 
   */
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

          /*
          // adjust height of the entity according to the ground
          let currentRegion = this._navMesh.getClosestRegion( destinationPos );
          const distance = currentRegion.plane.distanceToPoint( sourcePos );
          let newY = distance * 0.2; // smooth transition
          */

          // next position validated, update player
          this.x = newX;
          this.y = newY;
          this.z = newZ;
          this.rot = newRot;
          this.sequence = playerInput.seq;
          //this.state = EntityCurrentState.WALKING;

          // add player to server
          //Logger.info('Valid position for '+this.name+': ( x: '+this.x+', y: '+this.y+', z: '+this.z+', rot: '+this.rot);

      } else {

          // collision detected, return player old position
          this.x = oldX;
          this.y = 0;
          this.z = oldZ;
          this.rot = oldRot;
          this.sequence = playerInput.seq;
          //this.state = EntityCurrentState.IDLE;

          //Logger.warning('Invalid position for '+this.name+': ( x: '+this.x+', y: '+this.y+', z: '+this.z+', rot: '+this.rot);
      }
      
  }

  /**
   * Calculate rotation based on moving from v1 to v2
   * @param {Vector3} v1 
   * @param {Vector3} v2 
   * @returns rotation in radians
   */
  calculateRotation(v1:Vector3, v2:Vector3):number{
    return Math.atan2(v1.x - v2.x, v1.z - v2.z);
  }

  /**
   * Move entity toward a Vector3 position
   * @param {Vector3} source 
   * @param {Vector3} destination 
   * @param {number} speed movement speed
   * @returns {Vector3} new position
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
