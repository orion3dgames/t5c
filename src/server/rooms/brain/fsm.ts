export default class FSM {
    private activeState: Function; // points to the currently active state function

    constructor() {}

    public setState(state, context): void {
        this.activeState = state.bind(context);
        console.log("SET STATE", state);
    }

    public update(): void {
        if (this.activeState) {
            this.activeState();
        }
    }
}
