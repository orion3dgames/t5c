import { Schema, type } from "@colyseus/schema";
import Logger from "../../../shared/Logger";
import Config from "../../../shared/Config";
import { PlayerInputs } from "../../../shared/types";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { NavMesh, Vector3 } from "../../../shared/yuka";
import { GameRoom } from "../GameRoom";
import Races from "../../../shared/Data/Races";
import Abilities from "../../../shared/Data/Abilities";
import { roundTo } from "../../../shared/Utils";

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
  @type('number') public mana: number = 0;
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


  public isMoving: boolean = false;
  public player_interval;
  public player_cooldown: number = 1000;
  public ability_in_cooldown: boolean[];
  public player_cooldown_timer: number = 0;

  constructor(gameroom:GameRoom, ...args: any[]) {
		super(args);
    this._navMesh = gameroom.navMesh;
    this._gameroom = gameroom;
    this.raceData = Races[this.race];

    this.ability_in_cooldown = [
      false, 
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]
	}

  // runs on every server iteration
  update(){

    this.isMoving = false;

    // if player is dead
    if(this.health < 0 || this.health === 0){
      this.setAsDead();
    }

    if(this.mana < this.raceData.maxMana){
      this.mana += this.raceData.manaRegen;
    }

  }

  processAbility(target, data){

    // get ability 
    let ability_no = data.digit;
    let ability_key = (this.raceData.abilities && this.raceData.abilities[ability_no]) ?? false;
    let ability = Abilities[ability_key] ?? false;

    // if ability not found, cancel everything
    if(!ability){
      return false;
    }

    // if in cooldown
    if(this.ability_in_cooldown[ability_no]){
      return false;
    }

    if(this.mana < ability.mana_cost){
      return false;
    }

    // if target is not already dead
    if(!target.isDead()){

      // start timer
      this.player_cooldown_timer = this.player_cooldown;

      // rotate sender to lookAt target
      this.rot = this.calculateRotation(this.getPosition(), target.getPosition());

      // set target as target
      if(target.type === 'entity'){
        target.setTarget(this); 
      }

      // start cooldown period
      this.ability_in_cooldown[ability_no] = true;
      setTimeout(() => {
        this.ability_in_cooldown[ability_no] = false;
      }, ability.cooldown);

      // target loses health
      if(ability.type === 'direct'){
        //cannot hurt yourself
        if(target.sessionId !== this.sessionId){
          target.loseHealth(ability.value);
        }else{
          return false;
        }
      }

      // target wins health
      if(ability.type === 'heal'){
        target.winHealth(ability.value);
      }

      this.mana -= ability.mana_cost;
      if(this.mana < 0){
        this.mana = 0;
      }

      // send everyone else the information sender has attacked target
      this._gameroom.broadcast("ability_update", {
          key: ability.key,
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
      if(target.isDead()){ 

        // set entity as dead
        target.setAsDead();
        Logger.info(`[gameroom][processAbility] Entity is dead`, data);

        // delete so entity can be respawned
        setTimeout(() => {
            Logger.info(`[gameroom][processAbility] Deleting entity from server`, data);
            this._gameroom.state.entities.delete(target.sessionId);
        }, Config.MONSTER_RESPAWN_RATE);
      }

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

    setTimeout(()=>{
      this.health = 100;
      this.blocked = false;
      this.state = EntityCurrentState.IDLE
      this.setPosition(new Vector3(0, 0 , 0));
    }, 10000);
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

  isDead(){
    return this.health <= 0;
  }

  loseHealth(amount:number) {
    this.health -= amount;
    if(this.health < 0){
      this.health = 0;
    }
  }

  winHealth(amount:number) {
    this.health += amount;
    if(this.health > this.raceData.maxHealth){
      this.health = this.raceData.maxHealth;
    }
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

          this.isMoving = true;

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
