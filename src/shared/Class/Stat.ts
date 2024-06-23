import { CalculationTypes } from "../types";

export class Stat {
    private baseValue = 0;
    private value = 0;

    public modifiers = [];

    constructor(value) {
        this.baseValue = value;
        this.value = value;
    }

    public set(value, type = CalculationTypes.ADD) {
        var previous = this.value;

        console.log(`[gameroom][Stats][set] ${value} -> ${type}`);

        if (type === CalculationTypes.ADD) {
            this.value = this.value + value;
            let delta = this.value - this.baseValue;
            console.log(`[gameroom][Stats][add] ${previous} -> ${this.value} = ${delta}`);
        }

        if (type === CalculationTypes.MULTIPLY) {
            this.value = this.value * value;
            let delta = this.value - this.baseValue;
            console.log(`[gameroom][Stats][multiply] ${previous} -> ${this.value} = ${delta}`);
        }

        if (type === CalculationTypes.REMOVE) {
            this.value = this.value - value;
            let delta = this.value - this.baseValue;
            console.log(`[gameroom][Stats][remove] ${previous} -> ${this.value} = ${delta}`);
        }
    }
}
