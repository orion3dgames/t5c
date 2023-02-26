type Item = {
    name: string;
    value: number;
    scale?: number;
    rotationFix?: number;
    meshIndex?: number;
};

interface itemDataMap {
    [key: string]: Item;
}

let ItemsDB: itemDataMap = {
    apple: {
        name: "Apple",
        value: 25,
        meshIndex: 1,
    },
    pear: {
        name: "Pear",
        value: 200,
        meshIndex: 1,
    },
};

export { ItemsDB, Item };
