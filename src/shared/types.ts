export type PlayerUser = {
    id: number;
    username: string;
    password: string;
    token: string;
    characters?: PlayerCharacter[];
};

export type PlayerMessage = {
    type: string;
    senderID: string;
    name: string;
    message: string;
    timestamp: number;
    createdAt: string;
    color: string;
};

export type PlayerInputs = {
    seq: number;
    h: number;
    v: number;
};

export type PlayerCharacter = {
    id: number;
    user_id: number;
    name: string;
    location: string;
    x: number;
    y: number;
    z: number;
    rot: number;
    online: number;
    health: number;
    mana: number;
    level: number;
    experience: number;
};

export enum EntityState {
    IDLE = 0,
    WALKING = 1,
    RUNNING = 2,
    ATTACK = 3,
    TAKING_DAMAGE = 4,
    DEAD = 5,
    SPELL_CASTING = 6,
    SPELL_CAST = 7,
    PICKUP = 8,
}

export enum AI_STATE {
    IDLE = 0,
    WANDER = 1,
    SEEKING = 2,
    ATTACKING = 3,
}

export enum ServerMsg {
    PING = 1,
    PONG,
    CHAT_MESSAGE,
    SERVER_MESSAGE,
    PLAYER_SEND_MESSAGE,
    PLAYER_RESET_POSITION,
    PLAYER_RESSURECT,
    PLAYER_LEARN_SKILL,
    PLAYER_ADD_STAT_POINT,
    PLAYER_MOVE,
    PLAYER_MOVE_TO,
    PLAYER_PICKUP,
    PLAYER_DROP_ITEM,
    PLAYER_USE_ITEM,
    PLAYER_UNEQUIP_ITEM,
    PLAYER_ABILITY_PRESSED,
    PLAYER_ABILITY_CAST,
    PLAYER_CASTING_START,
    PLAYER_CASTING_CANCEL,
    PLAYER_TELEPORT,
    ENTITY_INTERACT,
    ENTITY_INTERACT_NEXT,
    ENTITY_INTERACT_END,
}

//////////////////////////////////////////////////////////////
///////////////// ABILITIES /////////////////////
//////////////////////////////////////////////////////////////

export type Ability = {
    // unique key
    key: string;

    // relative link to icon
    icon: string;

    // sound effect
    sound: string;

    // ability title
    title: string;

    // ability description
    description: string;

    // can ability be cast on self ? true or false
    castSelf: boolean;

    // cast time in milliseconds
    castTime: number;

    // cooldown period in milliseconds
    cooldown: number;

    // number of time this ability should repeat
    repeat: number;

    // interval this ability should repeat in milliseconds
    repeatInterval: number;

    // range this ability affects (any entity in this range will be affected the same)
    range: number;

    // min range target must be (if entity is further, prevent casting)
    minRange: number;

    // animation to play
    animation: EntityState;

    // the effect that will happen when the ability is played
    effect: {
        type?: string; // travel or self
        particule?: string; // choose from list of particule effects
        color?: string; // main color of effect
    };

    affinity?: string;

    // what properties will affect caster
    casterPropertyAffected: PropertyAffected[];

    // what properties will affect caster
    targetPropertyAffected: PropertyAffected[];

    // what properties a player must have to learn this ability
    requiredToLearn?;
};

export interface abilityMap {
    [key: string]: Ability;
}

export type PropertyAffected = {
    key: string;
    type: CalculationTypes;
    min: number;
    max: number;
};

//////////////////////////////////////////////////////////////
///////////////// ITEMS /////////////////////
//////////////////////////////////////////////////////////////

export enum ItemClass {
    WEAPON = 1,
    ARMOR = 2,
    CONSUMABLE = 3,
    QUEST = 4,
    OTHER = 5,
}

export enum PlayerSlots {
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

export enum ItemRarity {
    NORMAL = 0,
    RARE = 1,
    LEGENDARY = 2,
}

export type Item = {
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
        offset_x?: number;
        offset_y?: number;
        offset_z?: number;
        scale?: number;
    };

    meshData?: {
        scale?: number;
        rotationFix?: number;
        width?: number;
        height?: number;
        depth?: number;
    };
};

export interface itemDataMap {
    [key: string]: Item;
}

export enum PlayerKeys {
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

//////////////////////////////////////////////////////////////
///////////////// UTILS /////////////////////
//////////////////////////////////////////////////////////////

export type Race = {
    key: string;
    title: string;
    description: string;
    icon: string;
    speed: number;
    scale: number;
    rotationFix: number;
    meshIndex: number;
    animations: {
        [key: string]: {};
    };
    bones?: { [key: string]: number };
    baseHealth: number;
    baseMana: number;
    healthRegen: number;
    manaRegen: number;
    experienceGain?: {};
    goldGain?: {};
    drops?: ILootTableEntry[];
    default_abilities?: string[];
    materials?;
};

export interface raceDataMap {
    [key: string]: Race;
}

//////////////////////////////////////////////////////////////
///////////////// LOOT /////////////////////
//////////////////////////////////////////////////////////////

export declare type LootTable<T extends string = string, V extends number | string = number> = Array<Partial<ILootTableEntry<T, V>>>;

export interface ILootTableEntry<T extends string = string, V extends number | string = number, L extends Array<unknown> = LootTable<T>> {
    id: T | null;
    _nested?: L;
    weight: V;
    min: V;
    max: V;
    step: V;
    group: number;
    transform?: null | ((x: number) => number);
}

//////////////////////////////////////////////////////////////
///////////////// UTILS /////////////////////
//////////////////////////////////////////////////////////////

export enum CalculationTypes {
    ADD = 1,
    REMOVE = 2,
    MULTIPLY = 3,
}
