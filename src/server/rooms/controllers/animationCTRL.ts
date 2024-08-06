import { clearTimeout } from "timers";
import { EntityState } from "../../../shared/types";
import { GameRoomState } from "../state/GameRoomState";

export class animationCTRL {
    private _state: GameRoomState;

    private currentTimeout;

    constructor(state) {
        this._state = state;
    }

    public playAnim(owner, anim_state: EntityState, callback: () => void) {
        if (this.currentTimeout) {
            return false;
        }

        owner.anim_state = anim_state;

        // if spellcast, only play once
        if (anim_state === EntityState.ATTACK_VERTICAL) {
            this.currentTimeout = setTimeout(() => {
                owner.anim_state = EntityState.IDLE;
                this.currentTimeout = undefined;
            }, 1050);
        }

        // if spellcast, only play once
        if (anim_state === EntityState.ATTACK_HORIZONTAL) {
            this.currentTimeout = setTimeout(() => {
                owner.anim_state = EntityState.IDLE;
                this.currentTimeout = undefined;
            }, 900);
        }

        // if spellcast, only play once
        if (anim_state === EntityState.SPELL_CAST) {
            this.currentTimeout = setTimeout(() => {
                owner.anim_state = EntityState.IDLE;
                this.currentTimeout = undefined;
            }, 900);
        }

        // if spellcast, only play once
        if (anim_state === EntityState.PICKUP) {
            this.currentTimeout = setTimeout(() => {
                owner.anim_state = EntityState.IDLE;
                this.currentTimeout = undefined;
                if (callback) {
                    callback();
                }
            }, 900);
        }
    }
}
