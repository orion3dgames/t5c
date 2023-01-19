import { Schema, type } from "@colyseus/schema";
import Logger from "../../../shared/Logger";
import Config from "../../../shared/Config";
import { PlayerInputs } from "../../../shared/types";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { NavMesh, Vector3 } from "../../../shared/yuka";
import { GameRoom } from "../GameRoom";

export class PlayerState extends Schema {

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
  public _gameroom:GameRoom;
  public currentRegion;
  public toRegion;
  public destinationPath;
  public raceData;

  public player_interval;
  public player_cooldown: number = 500;
  public player_cooldown_timer: number = 0;

  constructor(gameroom:GameRoom, ...args: any[]) {
		super(args);
    this._navMesh = gameroom.navMesh;
    this._gameroom = gameroom;
	}

  // runs on every server iteration
  update(){

    // if player is dead
    if(this.health < 0 || this.health === 0){
      this.setAsDead();
    }

  }

  processAttack(target, data){

    if(this.player_interval){
      clearInterval(this.player_interval);
    }

    // if target is not already dead
    if(target && target.health > 0){

      this.player_cooldown_timer = this.player_cooldown;

      // rotate sender to lookAt target
      this.rot = this.calculateRotation(this.getPosition(), target.getPosition());

      // set attacker as target
      target.setTarget(this); 

      // let
      this.player_interval = setInterval(()=>{

        // target loses health
        target.loseHealth(40);

        // send everyone else the information sender has attacked target
        this._gameroom.broadcast("player_update", {
            action: 'attack',
            fromId: this.sessionId,
            fromPos: this.getPosition(),
            targetId: target.sessionId,
            targetPos: {
                x: target.x,
                y: target.y,
                z: target.z,
            }
        });

          // if target has no more health
        if(target.health == 0 || target.health < 0){ 

          clearInterval(this.player_interval);

          // set entity as dead
          target.setAsDead();
          Logger.info(`[gameroom][playerAction] Entity is dead`, data);

          // delete so entity can be respawned
          setTimeout(() => {
              Logger.info(`[gameroom][playerAction] Deleting entity from server`, data);
              this._gameroom.state.entities.delete(target.sessionId);
          }, Config.MONSTER_RESPAWN_RATE);
        }

      }, this.player_cooldown);

    }else{
      
      Logger.error(`[gameroom][playerAction] target or sender is invalid`, data);
    }

  }

  getPosition(){
    return new Vector3(this.x, this.y, this.z);
  }

  setAsDead(){
    this.health = 0;
    this.blocked = true;
    this.state = EntityCurrentState.DEAD;
  }

  resetDestination():void{
    this.toRegion = false;
    this.destinationPath = false;
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

  /**
   * Calculate rotation based on moving from v1 to v2
   * @param {Vector3} v1 
   * @param {Vector3} v2 
   * @returns rotation in radians
   */
  calculateRotation(v1:Vector3, v2:Vector3):number{
    return Math.atan2(v1.x - v2.x, v1.z - v2.z);
  }
  

  

}
