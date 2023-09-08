import { type } from "@colyseus/schema";
import { Entity } from "./Entity";
import { Vector3 } from "../../../shared/Libs/yuka-min";
import { GameRoomState } from "../state/GameRoomState";

export class LootSchema extends Entity {
    // networked player specific
    @type("string") public type: string = "item";
    @type("number") public x: number = 0;
    @type("number") public y: number = 0;
    @type("number") public z: number = 0;
    @type("number") public rot: number = 0;
    @type("string") public key: string = "";
    @type("int16") public qty: number = 0;

    public spawnTimer: number = 0;
    public name: string = "";
    public description: string = "";

    public AI_TARGET;

    public _state: GameRoomState;

    constructor(state, data, ...args: any[]) {
        super();
        // assign data
        Object.assign(this, data);
        Object.assign(this, state.gameData.get("item", this.key));
    }

    // entity update
    public update(delta) {
        this.spawnTimer += delta;
    }

    getPosition() {
        return new Vector3(this.x, this.y, this.z);
    }
}
