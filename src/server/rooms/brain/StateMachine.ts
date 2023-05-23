import { BrainSchema } from "../schema/BrainSchema2";
import State from "./State";

/**
 * Finite state machine (FSM) for implementing State-driven agent design.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
export default class StateMachine {
    private owner: BrainSchema;
    private currentState: State;
    private previousState;
    private globalState;
    private states;
    private _typesMap;

    /**
     * Constructs a new state machine with the given values.
     *
     * @param {BrainSchema} owner - The owner of this state machine.
     */
    constructor(owner: BrainSchema) {
        this.owner = owner;
        this.previousState = null; // a reference to the last state the agent was in
        this.globalState = null;
        this.states = new Map();
        this._typesMap = new Map();
    }

    /**
     * Updates the internal state of the FSM. Usually called by {@link GameEntity#update}.
     *
     * @return {StateMachine} A reference to this state machine.
     */
    update() {
        if (this.globalState !== null) {
            this.globalState.execute(this.owner);
        }

        if (this.currentState !== null) {
            this.currentState.execute(this.owner);
        }

        return this;
    }

    /**
     * Adds a new state with the given ID to the state machine.
     *
     * @param {String} id - The ID of the state.
     * @param {State} state - The state.
     * @return {StateMachine} A reference to this state machine.
     */
    add(id, state) {
        if (state instanceof State) {
            this.states.set(id, state);
        }
        return this;
    }

    /**
     * Removes a state via its ID from the state machine.
     *
     * @param {String} id - The ID of the state.
     * @return {StateMachine} A reference to this state machine.
     */
    remove(id) {
        this.states.delete(id);

        return this;
    }

    /**
     * Returns the state for the given ID.
     *
     * @param {String} id - The ID of the state.
     * @return {State} The state for the given ID.
     */
    get(id) {
        return this.states.get(id);
    }

    /**
     * Performs a state change to the state defined by its ID.
     *
     * @param {String} id - The ID of the state.
     * @return {StateMachine} A reference to this state machine.
     */
    changeTo(id) {
        const state = this.get(id);

        this._change(state);

        return this;
    }

    /**
     * Returns to the previous state.
     *
     * @return {StateMachine} A reference to this state machine.
     */
    revert() {
        this._change(this.previousState);

        return this;
    }

    /**
     * Returns true if this FSM is in the given state.
     *
     * @return {Boolean} Whether this FSM is in the given state or not.
     */
    in(id) {
        const state = this.get(id);

        return state === this.currentState;
    }

    //

    _change(state) {
        this.previousState = this.currentState;

        if (this.currentState !== null) {
            this.currentState.exit(this.owner);
        }

        this.currentState = state;

        this.currentState.enter(this.owner);
    }
}
