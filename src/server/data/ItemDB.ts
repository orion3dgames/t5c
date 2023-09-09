import { itemDataMap, ItemClass, ItemRarity, PlayerSlots, PlayerKeys, CalculationTypes } from "../../shared/types";

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
            offset_x: -0,
            offset_z: 0,
            rotation: Math.PI / 2,
        },
        requirements: [{ key: PlayerKeys.LEVEL, amount: 1 }],
        benefits: [{ key: PlayerKeys.STRENGTH, type: CalculationTypes.ADD, amount: 10 }],
        meshData: {
            scale: 1.3,
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
            scale: 1.4,
        },
        requirements: [{ key: PlayerKeys.LEVEL, amount: 1 }],
        benefits: [{ key: PlayerKeys.STRENGTH, type: CalculationTypes.ADD, amount: 10 }],
        meshData: {
            scale: 1.4,
        },
    },

    helm_01: {
        key: "helm_01",
        title: "Helm",
        description: "Description.",
        icon: "ICON_ITEM_helm_01",
        class: ItemClass.ARMOR,
        value: 2000,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: false,
        rarity: ItemRarity.NORMAL,
        equippable: {
            slot: PlayerSlots.HEAD,
            mesh: "helm_01",
            material: "helm_material_01",
            offset_x: 0,
            offset_y: 0.575,
            offset_z: 0.055,
            scale: 1,
        },
        requirements: [{ key: PlayerKeys.LEVEL, amount: 1 }],
        benefits: [{ key: PlayerKeys.STRENGTH, type: CalculationTypes.ADD, amount: 10 }],
        meshData: {
            scale: 0.8,
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
            { key: PlayerKeys.AC, type: CalculationTypes.ADD, amount: 10 },
            { key: PlayerKeys.STRENGTH, type: CalculationTypes.ADD, amount: 8 },
            { key: PlayerKeys.WISDOM, type: CalculationTypes.REMOVE, amount: 2 },
        ],
        meshData: {
            scale: 1,
        },
    },

    potion_small_red: {
        key: "potion_small_red",
        title: "Small Health Potion",
        description: "A very useful potion that restores up to 25 health..",
        icon: "ICON_ITEM_potion_small_red",
        class: ItemClass.CONSUMABLE,
        value: 150,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: true,
        benefits: [{ key: PlayerKeys.HEALTH, type: CalculationTypes.ADD, amount: 25 }],
        meshData: {
            scale: 1.5,
        },
    },

    potion_small_blue: {
        key: "potion_small_blue",
        title: "Small Mana Potion",
        description: "A very useful potion that restores up to 25 mana..",
        icon: "ICON_ITEM_potion_small_blue",
        class: ItemClass.CONSUMABLE,
        value: 150,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: true,
        benefits: [{ key: PlayerKeys.MANA, type: CalculationTypes.ADD, amount: 25 }],
        meshData: {
            scale: 1.5,
        },
    },
};

export { ItemsDB };
