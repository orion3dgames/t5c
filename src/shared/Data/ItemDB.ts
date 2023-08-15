enum ItemClass {
    WEAPON = 1,
    ARMOR = 2,
    CONSUMABLE = 3,
    QUEST = 4,
    OTHER = 5,
}

enum PlayerSlots {
    HEAD = 1,
    AMULET = 2,
    CHEST = 3,
    PANTS = 4,
    SHOES = 5,
    WEAPON = 6,
    OFF_HAND = 7,
    RING_1 = 8,
    RING_2 = 9,
}

enum ItemRarity {
    NORMAL = 0,
    RARE = 1,
    LEGENDARY = 2,
}

type Item = {
    key: string;
    title: string;
    description: string;
    icon: string;
    material?: string;
    class: ItemClass;
    value: number;
    destroyable: boolean;
    sellable: boolean;
    tradable: boolean;
    stackable: boolean;
    rarity?: ItemRarity;
    requirements?: {};
    benefits?: {};

    equippable?: {
        slot: PlayerSlots;
        mesh?: string;
        material?: string;
        rotation?: number;
    };

    meshData?: {
        scale?: number;
        rotationFix?: number;
        width?: number;
        height?: number;
        depth?: number;
    };
};

interface itemDataMap {
    [key: string]: Item;
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

let ItemsDB: itemDataMap = {
    sword_01: {
        key: "sword_01",
        title: "Sword",
        description: "Description.",
        icon: "ICON_ITEM_sword_01",
        class: ItemClass.WEAPON,
        value: 2000,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: false,
        rarity: ItemRarity.NORMAL,
        equippable: {
            slot: PlayerSlots.WEAPON,
            mesh: "sword_01",
            material: "sword_material_01",
        },
        requirements: [{ key: PlayerKeys.LEVEL, amount: 1 }],
        benefits: [{ key: PlayerKeys.STRENGTH, type: ItemEffect.ADD, amount: 10 }],
        meshData: {
            scale: 1.2,
            width: 1,
            height: 0.2,
            depth: 0.2,
        },
    },

    shield_01: {
        key: "shield_01",
        title: "Shield",
        description: "A basic shield.",
        icon: "ICON_ITEM_shield_01",
        class: ItemClass.WEAPON,
        value: 2000,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: false,
        rarity: ItemRarity.NORMAL,
        equippable: {
            slot: PlayerSlots.OFF_HAND,
            mesh: "shield_01",
            material: "shield_01_base.jpg",
            rotation: Math.PI / 2,
        },
        requirements: [{ key: PlayerKeys.LEVEL, amount: 1 }],
        benefits: [{ key: PlayerKeys.STRENGTH, type: ItemEffect.ADD, amount: 10 }],
        meshData: {
            scale: 1.2,
            width: 1,
            height: 0.2,
            depth: 0.2,
        },
    },

    shield_01_gold: {
        key: "shield_01_gold",
        title: "Golden Shield",
        description: "A lovely golden shield.",
        icon: "ICON_ITEM_shield_01_gold",
        class: ItemClass.WEAPON,
        value: 20000,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: false,
        rarity: ItemRarity.RARE,
        equippable: {
            slot: PlayerSlots.OFF_HAND,
            mesh: "shield_01",
            material: "shield_01_gold.jpg",
            rotation: Math.PI / 2,
        },
        requirements: [{ key: PlayerKeys.LEVEL, amount: 1 }],
        benefits: [{ key: PlayerKeys.STRENGTH, type: ItemEffect.ADD, amount: 10 }],
        meshData: {
            scale: 1.2,
            width: 1,
            height: 0.2,
            depth: 0.2,
        },
    },

    amulet_01: {
        key: "amulet_01",
        title: "Amulet",
        description: "An ancient amulet from forgotten times, it's effect are still unknowm.",
        icon: "ICON_ITEM_amulet_01",
        class: ItemClass.ARMOR,
        value: 2000,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: false,
        rarity: ItemRarity.NORMAL,
        equippable: {
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
            scale: 0.25,
            width: 0.4,
            height: 0.4,
            depth: 0.4,
        },
    },

    apple: {
        key: "apple",
        title: "Apple",
        description: "A delicious apple.",
        icon: "ICON_ITEM_apple",
        class: ItemClass.CONSUMABLE,
        value: 54,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: true,
        benefits: [{ key: PlayerKeys.HEALTH, type: ItemEffect.ADD, amount: 5 }],
        meshData: {
            scale: 0.25,
            width: 0.4,
            height: 0.4,
            depth: 0.4,
        },
    },

    pear: {
        key: "pear",
        title: "Pear",
        description: "A delicious pear.",
        icon: "ICON_ITEM_pear",
        class: ItemClass.CONSUMABLE,
        value: 200,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: true,
        benefits: [{ key: PlayerKeys.HEALTH, type: ItemEffect.ADD, amount: 20 }],
        meshData: {
            scale: 0.2,
            width: 0.4,
            height: 0.4,
            depth: 0.4,
        },
    },

    potion_heal: {
        key: "potion_heal",
        title: "Heal Potion",
        description: "A very useful potion that restores up to 50 health..",
        icon: "ICON_ITEM_potion_heal",
        class: ItemClass.CONSUMABLE,
        value: 150,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: true,
        benefits: [{ key: PlayerKeys.HEALTH, type: ItemEffect.ADD, amount: 50 }],
        meshData: {
            scale: 1,
            width: 0.4,
            height: 0.4,
            depth: 0.4,
        },
    },
};

export { ItemsDB, Item, PlayerSlots, ItemClass, ItemRarity, PlayerKeys, ItemEffect };
