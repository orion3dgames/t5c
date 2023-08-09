import Config from "../../../shared/Config";
import { randomNumberInRange } from "../../../shared/Utils";
import { State } from "../brain/StateManager";

class IdleState extends State {
    private _rotationTimer: number = 0;
    private _rotationTimerTimeout: number = 0;

    enter(owner) {
        owner.IDLE_TIMER = 0;
        owner.IDLE_TIMER_LENGTH = randomNumberInRange(2000, 6000);
        this._rotationTimer = 0;
        this._rotationTimerTimeout = randomNumberInRange(2000, 5000);
    }

    execute(owner) {
        // if static spawn, stay idle
        if (owner.AI_SPAWN_INFO.type == "static") {
            return false;
        }

        // rotate AI each so often to give a illusion of life
        this._rotationTimer += Config.updateRate;
        if (this._rotationTimer > this._rotationTimerTimeout) {
            let newRot = randomNumberInRange(0, 360);
            owner.rot = newRot;
            this._rotationTimerTimeout = randomNumberInRange(2000, 5000);
        }

        // keep track of idling time
        owner.IDLE_TIMER += Config.updateRate;
        if (owner.IDLE_TIMER > owner.IDLE_TIMER_LENGTH) {
            owner._stateMachine.changeTo("PATROL");
            return false;
        }
        //console.log("[IdleState] idle entity", owner.IDLE_TIMER, owner.IDLE_TIMER_LENGTH);
    }

    exit(owner) {}
}

export default IdleState;
