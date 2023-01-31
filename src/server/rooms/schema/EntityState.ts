import { Schema, type } from "@colyseus/schema";
import { EntityCurrentState } from "../../../shared/Entities/Entity/EntityCurrentState";
import { NavMesh } from "../../../shared/yuka";
import Races from "../../../shared/Data/Races";

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
  @type('number') public mana: number = 0;
  @type('number') public level: number = 0;

  // flags
  @type('boolean') public blocked: boolean = false; // if true, used to block player and to prevent movement
  @type('number') public state: EntityCurrentState = EntityCurrentState.IDLE;

  public _navMesh:NavMesh;
  public _gameroom;
  public raceData;

  public isMoving: boolean = false;
  public isDead: boolean = false;

  constructor(gameroom, ...args: any[]) {
		super(args);
    this._navMesh = gameroom.navMesh;
    this._gameroom = gameroom;
    this.raceData = Races[this.race];
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

}
