import { BrainSchema } from "../schema/BrainSchema2";

export default class State {
    /**
     * This method is called once during a state transition when the {@link StateMachine} makes
     * this state active.
     *
     * @param {BrainSchema} owner - The game entity that represents the execution context of this state.
     */
    enter(owner) {}

    /**
     * This method is called per simulation step if this state is active.
     *
     * @param {BrainSchema} owner - The game entity that represents the execution context of this state.
     */
    execute(owner) {}

    /**
     * This method is called once during a state transition when the {@link StateMachine} makes
     * this state inactive.
     *
     * @param {BrainSchema} owner - The game entity that represents the execution context of this state.
     */
    exit(owner) {}
}
