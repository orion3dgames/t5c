type Item = {
    key: string;
    name: string;
    description: string;
    icon: string;
    value: number;
    type: ItemType;
    canEquip?: {
        slot: PlayerSlots;
    };
    requirements?: {};
    benefits?: {};
    meshData?: {
        scale?: number;
        rotationFix?: number;
        meshIndex?: number;
        width?: number;
        height?: number;
        depth?: number;
    };
};

interface itemDataMap {
    [key: string]: Item;
}

enum ItemType {
    WEAPON = 1,
    ARMOR = 2,
    CONSUMABLE = 3,
    QUEST = 4,
    OTHER = 5,
}

enum ItemEffect {
    ADD = 1,
    REMOVE = 2,
}

enum PlayerKeys {
    STRENGTH = "strength",
    ENDURANCE = "endurance",
    AGILITY = "agility",
    WISDOM = "wisdom",
    INTELLIGENCE = "inteligence",
    AC = "ac",
    LEVEL = "level",
    HEALTH = "health",
    MANA = "mana",
}

enum PlayerSlots {
    HEAD = 1,
    AMULET = 2,
    CHEST = 3,
    PANTS = 4,
    SHOES = 5,
    WEAPON_1 = 6,
    WEAPON_2 = 7,
    HAND_1 = 8,
    HAND_2 = 9,
}

let ItemsDB: itemDataMap = {

    sword_01: {
        key: "sword_01",
        name: "Sword",
        description: "Description.",
        icon: "ICON_ITEM_sword_01",
        type: ItemType.WEAPON,
        value: 2000,
        canEquip: {
            slot: PlayerSlots.HAND_1,
        },
        requirements: [
            { key: PlayerKeys.STRENGTH, amount: 20 },
        ],
        benefits: [
            { key: PlayerKeys.STRENGTH, type: ItemEffect.ADD, amount: 10 },
        ],
        meshData: {
            meshIndex: 0,
            scale: 1.2,
            width: 1, 
            height: 0.20, 
            depth: 0.20
        },
    },

    amulet_01: {
        key: "amulet_01",
        name: "Amulet",
        description: "An ancient amulet from forgotten times, it's effect are still unknowm.",
        icon: "ICON_ITEM_amulet_01",
        type: ItemType.ARMOR,
        value: 2000,
        canEquip: {
            slot: PlayerSlots.AMULET,
        },
        requirements: [
            { key: PlayerKeys.LEVEL, amount: 10 },
            { key: PlayerKeys.STRENGTH, amount: 20 },
        ],
        benefits: [
            { key: PlayerKeys.AC, type: ItemEffect.ADD, amount: 10 },
            { key: PlayerKeys.STRENGTH, type: ItemEffect.ADD, amount: 8 },
            { key: PlayerKeys.WISDOM, type: ItemEffect.REMOVE, amount: 2 },
        ],
        meshData: {
            meshIndex: 0,
            scale: 0.25,
            width: 0.40, 
            height: 0.40, 
            depth: 0.40
        },
    },

    apple: {
        key: "apple",
        name: "Apple",
        description: "A delicious apple.",
        icon: "ICON_ITEM_apple",
        type: ItemType.CONSUMABLE,
        value: 54,
        benefits: [{ key: PlayerKeys.HEALTH, type: ItemEffect.ADD, amount: 5 }],
        meshData: {
            meshIndex: 0,
            scale: 0.25,
            width: 0.40, 
            height: 0.40, 
            depth: 0.40
        },
    },

    pear: {
        key: "pear",
        name: "Pear",
        description: "A delicious pear.",
        icon: "ICON_ITEM_pear",
        type: ItemType.CONSUMABLE,
        value: 200,
        benefits: [{ key: PlayerKeys.HEALTH, type: ItemEffect.ADD, amount: 20 }],
        meshData: {
            meshIndex: 0,
            scale: 0.25,
            width: 0.40, 
            height: 0.40, 
            depth: 0.40
        },
    },

    potion_heal: {
        key: "potion_heal",
        name: "Heal Potion",
        description: "A very useful potion that restores up to 50 health..",
        icon: "ICON_ITEM_potion_heal",
        type: ItemType.CONSUMABLE,
        value: 150,
        benefits: [{ key: PlayerKeys.HEALTH, type: ItemEffect.ADD, amount: 50 }],
        meshData: {
            meshIndex: 0,
            scale: 0.25,
            width: 0.40, 
            height: 0.40, 
            depth: 0.40
        },
    },
};

export { ItemsDB, Item };
