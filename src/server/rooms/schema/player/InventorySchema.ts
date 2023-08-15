import { Schema, type } from "@colyseus/schema";
import { dataDB } from "../../../../shared/Data/dataDB";

import { PlayerSlots, ItemClass, ItemRarity } from "../../../../shared/Data/ItemDB";

export class InventorySchema extends Schema {
    // networked player specific
    @type("string") public key: string = "";
    @type("int16") public qty: number = 0;
    @type("string") public i: string = "0";

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

    constructor(data) {
        super(data);
        if (data && data.key) {
            Object.assign(this, data);
            Object.assign(this, dataDB.get("item", this.key));
        }
    }
}
