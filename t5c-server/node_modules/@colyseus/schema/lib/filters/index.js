"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientState = void 0;
class ClientState {
    constructor() {
        this.refIds = new WeakSet();
        this.containerIndexes = new WeakMap();
    }
    // containerIndexes = new Map<ChangeTree, Set<number>>();
    addRefId(changeTree) {
        if (!this.refIds.has(changeTree)) {
            this.refIds.add(changeTree);
            this.containerIndexes.set(changeTree, new Set());
        }
    }
    static get(client) {
        if (client.$filterState === undefined) {
            client.$filterState = new ClientState();
        }
        return client.$filterState;
    }
}
exports.ClientState = ClientState;
//# sourceMappingURL=index.js.map