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
    WALKING,
    RUNNING,
    TAKING_DAMAGE,
    DEAD,
    PICKUP,
    SPELL_CASTING,
    SPELL_CAST,
    UNARMED,
    ATTACK_01,
    ATTACK_02,
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
    PLAYER_HOTBAR_ACTIVATED,
    PLAYER_ABILITY_CAST,
    PLAYER_AUTO_ATTACK,
    PLAYER_CASTING_START,
    PLAYER_CASTING_CANCEL,
    PLAYER_TELEPORT,
    PLAYER_QUEST_UPDATE,
    PLAYER_BUY_ITEM,
    PLAYER_SELL_ITEM,
    DEBUG_REMOVE_ENTITIES,
    DEBUG_INCREASE_ENTITIES,
    DEBUG_DECREASE_ENTITIES,
    DEBUG_BOTS,
}

//////////////////////////////////////////////////////////////
///////////////// QUESTS /////////////////////
//////////////////////////////////////////////////////////////

export type Quest = {
    key: string;
    title: string;
    description: string;
    descriptionOngoing: string;
    descriptionReward: string;
    descriptionCompleted: string;
    objective: string;
    type: QuestObjective.KILL_AMOUNT;
    location: string;
    spawn_key: string;
    quantity: number;
    isRepeatable: boolean;
    rewards: {
        experience: number;
        gold: number;
        items: [];
    };
};

export enum QuestObjective {
    KILL_AMOUNT = 1,
    TALK_TO,
}

export type QuestObjectiveMap = { [key in QuestObjective]?: string };

export let QuestObjectives = {
    [QuestObjective.KILL_AMOUNT]: "Kill @TargetName @KillCompleted/@KillRequired",
    [QuestObjective.TALK_TO]: "Talk to @TargetName",
};

export type QuestUpdate = {
    key: string;
    status: QuestStatus;
};

export enum QuestStatus {
    NOT_ACCEPTED = 0,
    ACCEPTED,
    OBJECTIVE_UPDATE,
    READY_TO_COMPLETE,
    COMPLETED,
}

//////////////////////////////////////////////////////////////
///////////////// ABILITIES /////////////////////
//////////////////////////////////////////////////////////////

export enum AbilityType {
    PHYSICAL = 0,
    MENTAL,
}

export enum AbilityElement {
    FIRE = 0,
    WATER,
    EARTH,
    LIGHT,
}

export type Ability = {
    // unique key
    key: string;

    // relative link to icon
    icon: string;

    // sound effect
    sound: string;
    soundDelay: number;

    // ability title
    title: string;

    // ability description
    description: string;

    // can ability be cast on self ? true or false
    castSelf: boolean;
    needTarget: boolean;

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

    // if true, will repeat as long as user can
    autoattack?: boolean;

    // animation to play
    animation: EntityState;

    // the effect that will happen when the ability is played
    effect: {
        type?: string; // travel or self
        particule?: string; // choose from list of particule effects
        color?: string; // main color of effect
    };

    // what properties will affect caster
    casterPropertyAffected: PropertyAffected[];

    // what properties will affect caster
    targetPropertyAffected: PropertyAffected[];

    //
    type?: AbilityType;
    element?: AbilityElement;
    affinity?: PlayerKeys;

    // what properties a player must have to learn this ability
    required_level?: number;
    required_strength?: number;
    required_endurance?: number;
    required_agility?: number;
    required_intelligence?: number;
    required_wisdom?: number;

    // skill points
    //????????????????
    skill_points?: number;

    // costs
    value?: number;

    digit?: number;
    animationDuration?: number;
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
    BACK = 10,
}

export enum ItemRarity {
    NORMAL = 0,
    RARE = 1,
    LEGENDARY = 2,
}

export enum EquippableType {
    DYNAMIC = 0, // is attached to bone via dynamic weighting
    EMBEDDED, // is rigged via blender
    NOT_VISIBLE, // not visible as a mesh
}

export type Item = {
    key: string;
    model: string;
    title: string;
    description: string;
    icon: string;
    material?: string;
    color?: { r: number; g: number; b: number; a: number };
    class: ItemClass;
    cooldown?: number;
    value: number;
    destroyable: boolean;
    sellable: boolean;
    tradable: boolean;
    stackable: boolean;
    rarity?: ItemRarity;
    requirements?: {};
    statModifiers?: {};
    damage?;

    equippable?: {
        type?: EquippableType;
        slot?: PlayerSlots;
        mesh?: string;
        material?: number;
        rotation_x?: number;
        rotation_y?: number;
        rotation_z?: number;
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
    meshIndex?: number;
    animations?: {
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
    vat?;
    customizable?;
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

export enum Speed {
    VERY_SLOW = 0.2,
    SLOW = 0.35,
    MEDIUM = 0.65,
    QUICK = 0.8,
    VERY_QUICK = 1,
}

export enum CalculationTypes {
    ADD = 1,
    REMOVE = 2,
    MULTIPLY = 3,
}

export type EventToAction = {
    id: string;
    date: string;
    type: string;
    delay: number;
    length: number;
    actionned_on_tick?: number;
    action_on_tick?: number;
    callback: () => void;
};
