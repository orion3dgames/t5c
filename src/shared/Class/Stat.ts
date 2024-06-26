type Modifier = {
    type: "additive" | "multiplicative";
    value: number;
};

export class Stat {
    baseValue: number;
    additiveModifiers: Modifier[];
    multiplicativeModifiers: Modifier[];

    constructor(baseValue: number = 0) {
        this.baseValue = baseValue;
        this.additiveModifiers = [];
        this.multiplicativeModifiers = [];
    }

    get value(): number {
        let additiveSum = this.additiveModifiers.reduce((sum, mod) => sum + mod.value, 0);
        let additiveValue = this.baseValue + additiveSum;

        let multiplicativeProduct = this.multiplicativeModifiers.reduce((product, mod) => product * mod.value, 1);
        return additiveValue * multiplicativeProduct;
    }

    addModifier(modifier: Modifier): void {
        if (modifier.type === "additive") {
            this.additiveModifiers.push(modifier);
        } else if (modifier.type === "multiplicative") {
            this.multiplicativeModifiers.push(modifier);
        }
    }

    removeModifier(modifier: Modifier): void {
        if (modifier.type === "additive") {
            this.additiveModifiers = this.additiveModifiers.filter((mod) => mod !== modifier);
        } else if (modifier.type === "multiplicative") {
            this.multiplicativeModifiers = this.multiplicativeModifiers.filter((mod) => mod !== modifier);
        }
    }

    clearModifiers(): void {
        this.additiveModifiers = [];
        this.multiplicativeModifiers = [];
    }
}
