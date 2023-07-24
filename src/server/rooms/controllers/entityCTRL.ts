import { GameRoomState } from "../state/GameRoomState";
import { Enemy } from "../brain/Enemy";
import { Player } from "../brain/Player";

export class entityCTRL {
    public entities = [];

    constructor() {}

    hasEntities() {
        return this.entities.length > 0;
    }

    length() {
        return this.entities.length;
    }

    filter(type) {
        return this.entities.filter((entity) => entity.type === type);
    }

    get all() {
        return this.entities;
    }

    get(sessionId) {
        return this.entities[sessionId];
    }

    add(entity) {
        this.entities.push(entity);
    }

    delete(entity) {
        delete this.entities[entity.sessionId];
    }
}
