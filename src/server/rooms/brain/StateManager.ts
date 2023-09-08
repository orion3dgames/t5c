import { BrainSchema } from "../schema/BrainSchema";

/**
 * Base class for representing a state in context of State-driven agent design.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class State {
    /**
     * This method is called once during a state transition when the {@link StateManager} makes
     * this state active.
     *
     * @param {BrainSchema} owner - The game entity that represents the execution context of this state.
     */
    enter(owner: BrainSchema) {}

    /**
     * This method is called per simulation step if this state is active.
     *
     * @param {BrainSchema} owner - The game entity that represents the execution context of this state.
     */
    execute(owner: BrainSchema) {}

    /**
     * This method is called once during a state transition when the {@link StateManager} makes
     * this state inactive.
     *
     * @param {BrainSchema} owner - The game entity that represents the execution context of this state.
     */
    exit(owner: BrainSchema) {}

    /**
     * Transforms this instance into a JSON object.
     *
     * @return {Object} The JSON object.
     */
    toJSON() {}

    /**
     * Restores this instance from the given JSON object.
     *
     * @param {Object} json - The JSON object.
     * @return {State} A reference to this state.
     */
    fromJSON(json) {}

    /**
     * Restores UUIDs with references to GameEntity objects.
     *
     * @param {Map<String, BrainSchema>} entities - Maps game entities to UUIDs.
     * @return {State} A reference to this state.
     */
    resolveReferences(entities) {}

    /**
     * This method is called when messaging between game entities occurs.
     *
     * @param {BrainSchema} owner - The game entity that represents the execution context of this state.
     * @param {Telegram} telegram - A data structure containing the actual message.
     * @return {Boolean} Whether the message was processed or not.
     */
    onMessage(owner, telegram) {
        return false;
    }
}

class StateManager {
    public owner;
    public currentState;
    public previousState;
    public globalState;
    public states;
    private _typesMap;

    constructor(owner = null) {
        /**
         * The game entity that owns this state machine.
         * @type {?BrainSchema}
         * @default null
         */
        this.owner = owner;

        /**
         * The current state of the game entity.
         * @type {?State}
         * @default null
         */
        this.currentState = null;

        /**
         * The previous state of the game entity.
         * @type {?State}
         * @default null
         */
        this.previousState = null; // a reference to the last state the agent was in

        /**
         * This state logic is called every time the state machine is updated.
         * @type {?State}
         * @default null
         */
        this.globalState = null;

        /**
         * A map with all states of the state machine.
         * @type {Map<String,State>}
         */
        this.states = new Map();

        //

        this._typesMap = new Map();
    }

    /**
     * Updates the internal state of the FSM.
     *
     * @return {StateManager} A reference to this state machine.
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
     * @return {StateManager} A reference to this state machine.
     */
    add(id, state) {
        if (state instanceof State) {
            this.states.set(id, state);
        } else {
            console.warn('YUKA.StateMachine: .add() needs a parameter of type "YUKA.State".');
        }

        return this;
    }

    /**
     * Removes a state via its ID from the state machine.
     *
     * @param {String} id - The ID of the state.
     * @return {StateManager} A reference to this state machine.
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
     * @return {StateManager} A reference to this state machine.
     */
    changeTo(id) {
        const state = this.get(id);

        this._change(state);

        return this;
    }

    /**
     * Returns to the previous state.
     *
     * @return {StateManager} A reference to this state machine.
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

    /**
     * Transforms this instance into a JSON object.
     *
     * @return {Object} The JSON object.
     */
    toJSON() {
        const json = {
            owner: this.owner.uuid,
            currentState: null,
            previousState: null,
            globalState: null,
            states: new Array(),
        };

        const statesMap = new Map();

        // states

        for (let [id, state] of this.states) {
            json.states.push({
                type: state.constructor.name,
                id: id,
                state: state.toJSON(),
            });

            statesMap.set(state, id);
        }

        json.currentState = statesMap.get(this.currentState) || null;
        json.previousState = statesMap.get(this.previousState) || null;
        json.globalState = statesMap.get(this.globalState) || null;

        return json;
    }

    /**
     * Restores this instance from the given JSON object.
     *
     * @param {Object} json - The JSON object.
     * @return {StateManager} A reference to this state machine.
     */
    fromJSON(json) {
        this.owner = json.owner;

        //

        const statesJSON = json.states;

        for (let i = 0, l = statesJSON.length; i < l; i++) {
            const stateJSON = statesJSON[i];
            const type = stateJSON.type;

            const ctor = this._typesMap.get(type);

            if (ctor !== undefined) {
                const id = stateJSON.id;
                const state = new ctor().fromJSON(stateJSON.state);

                this.add(id, state);
            } else {
                console.warn("YUKA.StateMachine: Unsupported state type:", type);
                continue;
            }
        }

        //

        this.currentState = json.currentState !== null ? this.get(json.currentState) || null : null;
        this.previousState = json.previousState !== null ? this.get(json.previousState) || null : null;
        this.globalState = json.globalState !== null ? this.get(json.globalState) || null : null;

        return this;
    }

    /**
     * Restores UUIDs with references to GameEntity objects.
     *
     * @param {Map<String,BrainSchema>} entities - Maps game entities to UUIDs.
     * @return {StateManager} A reference to this state machine.
     */
    resolveReferences(entities) {
        this.owner = entities.get(this.owner) || null;

        for (let state of this.states.values()) {
            state.resolveReferences(entities);
        }

        return this;
    }

    /**
     * Registers a custom type for deserialization. When calling {@link StateMachine#fromJSON}
     * the state machine is able to pick the correct constructor in order to create custom states.
     *
     * @param {String} type - The name of the state type.
     * @param {Function} constructor - The constructor function.
     * @return {StateManager} A reference to this state machine.
     */
    registerType(type, constructor) {
        this._typesMap.set(type, constructor);

        return this;
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

export { State, StateManager };
