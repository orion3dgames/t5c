import { clearTimeout } from "timers";
import { EntityState } from "../../../shared/types";
import { GameRoomState } from "../state/GameRoomState";

export class animationCTRL {
    private _state: GameRoomState;

    public isAnimating: boolean;
    private currentTimeout;

    constructor(state) {
        this._state = state;
    }

    public playAnim(owner, anim_start: EntityState, anim_end: EntityState, duration: number = 1000, callback: () => void) {
        if (this.isAnimating) {
            return false;
        }

        // set new animation state
        owner.anim_state = anim_start;
        this.isAnimating = true;

        // set timeout
        this.currentTimeout = setTimeout(() => {
            owner.anim_state = anim_end;
            this.isAnimating = false;
            if (callback) {
                callback();
            }
        }, duration);
    }
}
