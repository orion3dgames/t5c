import { dataDB } from "../../../shared/Data/dataDB";
import { GameEntity, StateMachine } from "../../../shared/yuka";
import { abilitiesCTRL } from "../controllers/abilityCTRL";
import { AbilitySchema } from "../schema/AbilitySchema";
import { EnemySchema } from "../schema/EnemySchema";
import { PlayerSchema } from "../schema/PlayerSchema";

import IdleState from "../brain/states/IdleState";

class Enemy extends GameEntity {
    public _navMesh;
    public _gameroom;
    public entity;
    public stateMachine;
    public schema;

    constructor(gameroom, schema, ...args: any[]) {
        super(gameroom, args);

        // variables
        this._navMesh = gameroom.navMesh;
        this._gameroom = gameroom;
        this.schema = schema;

        this.stateMachine = new StateMachine(this);

        this.stateMachine.add("IDLE", new IdleState());

        this.stateMachine.changeTo("IDLE");
    }

    public update() {
        this.stateMachine.update();
    }
}

export { Enemy };
