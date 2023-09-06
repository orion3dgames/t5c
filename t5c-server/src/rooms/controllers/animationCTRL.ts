import { EntityState } from "../../../../t5c-shared";
import { GameRoomState } from "../state/GameRoomState";

export class animationCTRL {
    private _state: GameRoomState;
    constructor(state) {
        this._state = state;
    }

    public playAnim(owner, anim_state: EntityState): void {
        owner.anim_state = anim_state;

        // if spellcast, only play once
        if (anim_state === EntityState.SPELL_CAST) {
            setTimeout(() => {
                owner.anim_state = EntityState.IDLE;
            }, 900);
        }
    }
}
