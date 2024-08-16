import { itemDataMap, ItemClass, ItemRarity, PlayerSlots, PlayerKeys, CalculationTypes, EquippableType } from "../../shared/types";

let ItemsDB: itemDataMap = {
    sword_01: {
        key: "sword_01",
        model: "sword_01", // mesh name
        title: "Sword +1",
        description: "Description.",
        icon: "ICON_ITEM_sword_01",
        material: "knight_texture.png",
        class: ItemClass.WEAPON,
        value: 100,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: false,
        rarity: ItemRarity.NORMAL,
        equippable: {
            type: EquippableType.DYNAMIC,
            slot: PlayerSlots.WEAPON,
            mesh: "sword_01",
            rotation_y: Math.PI * 1.5,
        },
        requirements: [{ key: PlayerKeys.LEVEL, amount: 1 }],
        statModifiers: {
            strength: [{ type: CalculationTypes.ADD, value: 10 }],
        },
        damage: { min: 1, max: 3 },
        meshData: {
            scale: 1.3,
        },
    },

    shield_01: {
        key: "shield_01",
        model: "shield_01",
        title: "Shield",
        description: "A basic shield.",
        icon: "ICON_ITEM_shield_01",
        material: "knight_texture.png",
        class: ItemClass.WEAPON,
        value: 2000,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: false,
        rarity: ItemRarity.NORMAL,
        equippable: {
            type: EquippableType.DYNAMIC,
            slot: PlayerSlots.OFF_HAND,
            mesh: "shield_01",
            rotation_y: Math.PI * 1.5,
            scale: 1.4,
        },
        requirements: [{ key: PlayerKeys.LEVEL, amount: 1 }],
        statModifiers: {
            ac: [{ type: CalculationTypes.ADD, value: 5 }],
        },
        meshData: {
            scale: 1.4,
        },
    },

    helm_01: {
        key: "helm_01",
        model: "helm_01",
        title: "Helm",
        description: "Description.",
        icon: "ICON_ITEM_helm_01",
        material: "knight_texture.png",
        class: ItemClass.ARMOR,
        value: 2000,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: false,
        rarity: ItemRarity.NORMAL,
        equippable: {
            type: EquippableType.DYNAMIC,
            slot: PlayerSlots.HEAD,
            mesh: "helm_01",
            offset_y: 0.575,
            offset_z: 0.055,
            rotation_y: Math.PI * 1.5,
            scale: 1,
        },
        requirements: [{ key: PlayerKeys.LEVEL, amount: 1 }],
        statModifiers: {
            ac: [{ type: CalculationTypes.ADD, value: 5 }],
        },
        meshData: {
            scale: 0.8,
        },
    },

    hat_01: {
        key: "hat_01",
        model: "hat_01",
        title: "Helm",
        description: "Description.",
        icon: "ICON_ITEM_hat_01",
        material: "mage_texture.png",
        class: ItemClass.ARMOR,
        value: 2000,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: false,
        rarity: ItemRarity.LEGENDARY,
        equippable: {
            type: EquippableType.DYNAMIC,
            slot: PlayerSlots.HEAD,
            mesh: "hat_01",
            offset_y: 1,
            offset_z: -0.1,
            rotation_y: Math.PI * 1.5,
            rotation_z: 0.2,
            scale: 1,
        },
        requirements: [{ key: PlayerKeys.LEVEL, amount: 1 }],
        statModifiers: {
            ac: [{ type: CalculationTypes.ADD, value: 5 }],
        },
        meshData: {
            scale: 0.8,
        },
    },

    armor_01: {
        key: "armor_01",
        model: "armor_01",
        title: "Purple Robe",
        description: "Description.",
        icon: "ICON_ITEM_armor_01",
        material: "mage_texture.png",
        class: ItemClass.ARMOR,
        value: 2000,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: false,
        rarity: ItemRarity.NORMAL,
        equippable: {
            type: EquippableType.EMBEDDED,
            slot: PlayerSlots.CHEST,
            mesh: "Armor_Robe",
            material: 4,
        },
        requirements: [{ key: PlayerKeys.LEVEL, amount: 1 }],
        statModifiers: {
            ac: [{ type: CalculationTypes.ADD, value: 5 }],
        },
        meshData: {
            scale: 1,
        },
    },

    armor_02: {
        key: "armor_02",
        model: "armor_01",
        title: "White Robe",
        description: "Description.",
        icon: "ICON_ITEM_armor_02",
        material: "knight_texture_alt_C.png",
        class: ItemClass.ARMOR,
        value: 2000,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: false,
        rarity: ItemRarity.RARE,
        equippable: {
            type: EquippableType.EMBEDDED,
            slot: PlayerSlots.CHEST,
            mesh: "Armor_Robe",
        },
        requirements: [{ key: PlayerKeys.LEVEL, amount: 1 }],
        statModifiers: {
            ac: [{ type: CalculationTypes.ADD, value: 5 }],
        },
        meshData: {
            scale: 1,
        },
    },

    /*
    cape_01: {
        key: "cape_01",
        model: "cape_01",
        title: "Cape ",
        description: "Description.",
        icon: "ICON_ITEM_armor_02",
        material: "knight_texture.png",
        class: ItemClass.ARMOR,
        value: 2000,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: false,
        rarity: ItemRarity.RARE,
        equippable: {
            type: EquippableType.EMBEDDED,
            slot: PlayerSlots.BACK,
            mesh: "Armor_Cape",
        },
        requirements: [{ key: PlayerKeys.LEVEL, amount: 1 }],
        statModifiers: {
            ac: [{ type: CalculationTypes.ADD, value: 5 }],
        },
        meshData: {
            scale: 1,
        },
    },*/

    amulet_01: {
        key: "amulet_01",
        model: "amulet_01",
        title: "Amulet",
        description: "An ancient amulet from forgotten times, it's effect are still unknowm.",
        icon: "ICON_ITEM_amulet_01",
        class: ItemClass.ARMOR,
        value: 2000,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: false,
        rarity: ItemRarity.LEGENDARY,
        equippable: {
            type: EquippableType.NOT_VISIBLE,
            slot: PlayerSlots.AMULET,
        },
        requirements: [
            { key: PlayerKeys.LEVEL, amount: 10 },
            { key: PlayerKeys.STRENGTH, amount: 20 },
        ],
        statModifiers: {
            intelligence: [{ type: CalculationTypes.ADD, value: 5 }],
            wisdom: [{ type: CalculationTypes.ADD, value: 5 }],
        },
        meshData: {
            scale: 1,
        },
    },

    potion_small_red: {
        key: "potion_small_red",
        model: "potion_small_red",
        title: "Small Health Potion",
        description:
            "A very useful potion that restores up to 25 health, A very useful potion that restores up to 25 health, A very useful potion that restores up to 25 health",
        icon: "ICON_ITEM_potion_small_red",
        material: "druid_texture.png",
        class: ItemClass.CONSUMABLE,
        cooldown: 1000,
        value: 150,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: true,
        statModifiers: {
            health: [{ type: CalculationTypes.ADD, value: 25 }],
        },
        meshData: {
            scale: 1.5,
        },
    },

    potion_small_blue: {
        key: "potion_small_blue",
        model: "potion_small_blue",
        title: "Small Mana Potion",
        description: "A very useful potion that restores up to 25 mana..",
        icon: "ICON_ITEM_potion_small_blue",
        material: "druid_texture.png",
        class: ItemClass.CONSUMABLE,
        cooldown: 1000,
        value: 150,
        destroyable: false,
        sellable: true,
        tradable: true,
        stackable: true,
        statModifiers: {
            mana: [{ type: CalculationTypes.ADD, value: 25 }],
        },
        meshData: {
            scale: 1.5,
        },
    },
};

export { ItemsDB };
