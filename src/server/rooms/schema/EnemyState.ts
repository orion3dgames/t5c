import { Schema, type } from "@colyseus/schema";
import Logger from "../../../shared/Logger";
import Config from "../../../shared/Config";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { AI_STATE } from "../../../shared/Entities/Entity/AIState";
import { NavMesh, Vector3 } from "../../../shared/yuka";
import Races from "../../../shared/Data/Races";
import { EntityState } from "./EntityState";
import { PlayerState } from "./PlayerState";

export class EnemyState extends EntityState {

  // networked vars
  @type('number') public AI_CURRENT_STATE:AI_STATE = 0;

  // public vars
  public currentRegion;
  public toRegion;
  public destinationPath;

  public AI_STATE_REMAINING_DURATION:number = 0;

  public AI_CURRENT_TARGET_POSITION = null;
  public AI_CURRENT_TARGET_DISTANCE = 0;
  public AI_CURRENT_TARGET:PlayerState;
  public AI_CURRENT_TARGET_FOUND = false;

  public AI_SEEKING_ELAPSED_TIME:number = 0;

  public AI_CLOSEST_TARGET_POSITION = null;
  public AI_CLOSEST_TARGET_DISTANCE:number = 0;
  public AI_CLOSEST_TARGET = null;

  public AI_ATTACK_INTERVAL:number = 0; 
  public AI_ATTACK_INTERVAL_RATE: number = 1000; 

  constructor(gameroom, ...args: any[]) {
		super(gameroom, args);
	}

  // runs on every server iteration
  update(){

    // 
    this.AI_CURRENT_TARGET_POSITION = null;
    this.AI_CURRENT_TARGET_DISTANCE = 0;
    this.AI_CLOSEST_TARGET_POSITION = null;
    this.AI_CLOSEST_TARGET_DISTANCE = 0;
    this.AI_CLOSEST_TARGET = null;

    //
    let closestDistance = 1000000;
    this._gameroom.state.players.forEach(entity => {

      // only for entity 
      if(this.type === 'entity' && entity.type === 'player' ){

        // entity must always know the closest player at all times
        // todo: there must be a better way to do this
        let playerPos = new Vector3(entity.x, entity.y, entity.z);
        let entityPos = new Vector3(this.x, this.y, this.z);
        let distanceBetween = entityPos.distanceTo(playerPos);
        if(distanceBetween < closestDistance){
          closestDistance = distanceBetween;
          this.AI_CLOSEST_TARGET_POSITION = new Vector3(entity.x, entity.y, entity.z);
          this.AI_CLOSEST_TARGET_DISTANCE = distanceBetween;
          this.AI_CLOSEST_TARGET = entity;
        }

        // if entity has a target, monitor it's position
        if(this.AI_CURRENT_TARGET !== null && this.AI_CURRENT_TARGET !== undefined && this.AI_CURRENT_TARGET.sessionId){
          let targetPos = this.AI_CURRENT_TARGET.getPosition();
          let entityPos = this.getPosition();
          let distanceBetween = entityPos.distanceTo(targetPos);
          this.AI_CURRENT_TARGET_POSITION = targetPos;
          this.AI_CURRENT_TARGET_DISTANCE = distanceBetween;
        }else{

          // else entity has no target
          this.AI_CURRENT_TARGET = null;
          this.AI_CURRENT_TARGET_POSITION = null;
          this.AI_CURRENT_TARGET_DISTANCE = distanceBetween;
        }
        
      }

    });


    if(this.type === 'entity' ){

      // default behaviour
      this.AI_CURRENT_STATE = AI_STATE.IDLE;

      // if entity has a target, 
      if(this.AI_CURRENT_TARGET != null){
        
        // start chasing player
        this.AI_CURRENT_STATE = AI_STATE.SEEKING;

        // if entity is close enough to player, start attacking it
        if(this.AI_CURRENT_TARGET_DISTANCE < Config.MONSTER_ATTACK_DISTANCE){

          // set ai state to attack
          this.AI_CURRENT_STATE = AI_STATE.ATTACKING;
          this.AI_CURRENT_TARGET_FOUND = true;

        }else{
          // increment seeking timer
          this.AI_SEEKING_ELAPSED_TIME += 1;
        }

        // if entity is seeking and target gets away return to wandering
        // - found and attacked player, but player managed to get away
        // - was seeking player for over 50 server iteration but did not manage to catch player
        if(
          (this.AI_CURRENT_TARGET_FOUND && this.AI_CURRENT_TARGET_DISTANCE > Config.MONSTER_AGGRO_DISTANCE) || 
          (this.AI_SEEKING_ELAPSED_TIME > 50) 
        ){
          this.AI_CURRENT_STATE = AI_STATE.WANDER;
          this.AI_CURRENT_TARGET = null;
          this.AI_CURRENT_TARGET_DISTANCE = 0;
          this.AI_CURRENT_TARGET_FOUND = false;
          this.AI_SEEKING_ELAPSED_TIME = 0;
        }

      }

      // if no target, monitor closest player for range distance
      if(this.AI_CURRENT_TARGET === null){
        this.AI_CURRENT_STATE = AI_STATE.WANDER;
        if(this.AI_CLOSEST_TARGET && this.AI_CLOSEST_TARGET_DISTANCE < Config.MONSTER_AGGRO_DISTANCE){ 
          this.setTarget(this.AI_CLOSEST_TARGET); 
        } 
      }

      // if entity is dead
      if(this.health < 0 || this.health === 0){
        this.AI_CURRENT_STATE = AI_STATE.IDLE;
      }

      // something is wrong
      if(this.AI_CURRENT_TARGET && !this._gameroom.state.players.get(this.AI_CURRENT_TARGET.sessionId)){
        this.returnToWandering();
      }

      /*
      console.log(this.sessionId, this.race, AI_STATE[AI_STATE.IDLE], 
        (this.AI_CURRENT_TARGET ? this.AI_CURRENT_TARGET.name : null),
         (this.AI_CLOSEST_TARGET ? this.AI_CLOSEST_TARGET.name : null),
         this.AI_CLOSEST_TARGET_DISTANCE);*/

    }

  }

  isEntityDead(){
    return this.health <= 0;
  }

  returnToWandering(){
    this.AI_CURRENT_TARGET = null;
    this.AI_CURRENT_STATE = AI_STATE.WANDER;
  }

  getPosition(){
    return new Vector3(this.x, this.y, this.z);
  }

  setTarget(target){
    this.AI_CURRENT_TARGET = target;
  }

  setAsDead(){
    this.health = 0;
    this.blocked = true;
    this.state = EntityCurrentState.DEAD;
    this.AI_CURRENT_STATE = AI_STATE.IDLE;
    this.AI_CURRENT_TARGET = null;

    // delete so entity can be respawned
    setTimeout(() => {
      Logger.info(`[gameroom][processAbility] Deleting entity from server`, this.sessionId);
      this._gameroom.state.entities.delete(this.sessionId);
    }, Config.MONSTER_RESPAWN_RATE);
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
   * ATTACK BEHAVIOUR
   */
  attack(){

    // entity animation set to attack
    this.state = EntityCurrentState.ATTACK;

    this.AI_ATTACK_INTERVAL += 100;

    if(this.AI_ATTACK_INTERVAL === this.AI_ATTACK_INTERVAL_RATE){
      this.AI_ATTACK_INTERVAL = 0;
      this.AI_CURRENT_TARGET.loseHealth(10);
    }

    if(this.AI_CURRENT_TARGET.health <= 0){
      this.returnToWandering();
    }

  }

  /**
   * SEEK BEHAVIOUR
   */
  seek(){

    // reset any previous path
    this.resetDestination();

    // save current position
    let currentPos = this.getPosition();

    // calculate next position towards destination
    let updatedPos = this.moveTo(currentPos, this.AI_CURRENT_TARGET_POSITION, this.raceData.speed);
    this.setPosition(updatedPos);

    // calculate rotation
    this.rot = this.calculateRotation(currentPos, updatedPos);

  }

  /**
   * WANDER BEHAVIOUR
   */
  wander(){
    
    // save current position
    let currentPos = this.getPosition();

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



  goToDestination(){
    
    // save current position
    let currentPos = this.getPosition();

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

        // something is wrong, let's cancel destination
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

  
  /**
   * Finds a valid position on navmesh matching the supplier targetPos and sets is as the new destination for this entity
   * @param {Vector3} targetPos
   */
  setDestination(targetPos:Vector3):void{
    let currentPos = new Vector3(this.x, this.y,this.z);
    this.toRegion = this._gameroom.navMesh.getClosestRegion(targetPos);
    this.destinationPath = this._gameroom.navMesh.findPath(
        currentPos,
        targetPos
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

  setLocation(location:string):void {
    this.location = location;
  }

  setPosition(updatedPos:Vector3):void{
    this.x = updatedPos.x;
    this.y = updatedPos.y;
    this.z = updatedPos.z;
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
