export default class FSM {
    private activeState: Function; // points to the currently active state function

    constructor() {}

    public setState(state): void {
        this.activeState = state;
    }

    public update(): void {
        if (this.activeState != null) {
            this.activeState();
        }
    }
}
