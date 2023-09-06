import { ChangeTree } from "../changes/ChangeTree";
import { ClientWithSessionId } from "../annotations";
export declare class ClientState {
    refIds: WeakSet<ChangeTree>;
    containerIndexes: WeakMap<ChangeTree, Set<number>>;
    addRefId(changeTree: ChangeTree): void;
    static get(client: ClientWithSessionId): ClientState;
}
