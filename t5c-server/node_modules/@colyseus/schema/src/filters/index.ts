import { ChangeTree } from "../changes/ChangeTree";
import { ClientWithSessionId } from "../annotations";

export class ClientState {
    refIds = new WeakSet<ChangeTree>();
    containerIndexes = new WeakMap<ChangeTree, Set<number>>();
    // containerIndexes = new Map<ChangeTree, Set<number>>();

    addRefId(changeTree: ChangeTree) {
        if (!this.refIds.has(changeTree)) {
            this.refIds.add(changeTree);
            this.containerIndexes.set(changeTree, new Set());
        }
    }

    static get(client: ClientWithSessionId) {
        if (client.$filterState === undefined) {
            client.$filterState = new ClientState();
        }

        return client.$filterState as ClientState;
    }
}
