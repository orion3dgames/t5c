import { GameRoomState } from "../state/GameRoomState";

export class entityCTRL {
    private _state: GameRoomState;

    constructor(state) {
        this._state = state;
    }

    hasEntities() {
        return this._state.entities.size > 0;
    }

    length() {
        return this._state.entities.size;
    }

    // not reactive
    filter(type) {
        return new Map(
            Array.from(this._state.entities).filter(([_key, value]) => {
                if (value.type === type) {
                    return true;
                }
                return false;
            })
        );
    }

    get all() {
        return this._state.entities;
    }

    get(sessionId) {
        return this._state.entities.get(sessionId);
    }

    add(entity) {
        this._state.entities.set(entity.sessionId, entity);
    }

    delete(entity) {
        this._state.entities.delete(entity.sessionId);
    }
}