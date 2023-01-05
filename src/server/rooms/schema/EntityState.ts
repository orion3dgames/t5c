import { Schema, type } from "@colyseus/schema";
import { PlayerCurrentState } from "../../../shared/Entities/Player/PlayerCurrentState";

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

  public destination;
  public navmesh;
  public yukaEntity;

  constructor(navmesh, ...args: any[]) {
		super(args);

    this.navmesh = navmesh;

    this.spawn(args);
	}

  moveRandomly(){

    let randomRegion = this.navmesh.getRandomRegion();
    let point = randomRegion.centroid;
    this.x = point.x;
    this.y = point.y;
    this.z = point.z;
    console.log('ENTITY MOVED TO ', point);

  }

  spawn(args){

  }

  setPositionManual(x, y, z, rot) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.rot = rot;
  }

  loseHealth(amount:number) {
    this.health -= amount;

    // if player has no more health
    // todo: send him back to spawnpoint with health back to 50;
    if(this.health === 0){
      this.state = PlayerCurrentState.DEAD;
      this.blocked = true;
    }
  }

}
