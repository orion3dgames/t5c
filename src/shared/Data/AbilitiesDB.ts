type Ability = {
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

interface abilityMap {
    [key: string]: Ability;
}

enum CALC {
    ADD = 1,
    REMOVE = 2,
    MULTIPLY = 3,
}

type PropertyAffected = {
    key: string;
    type: CALC;
    min: number;
    max: number;
};

let AbilitiesDB: abilityMap = {
    base_attack: {
        title: "Attack",
        key: "base_attack",
        icon: "ICON_ABILITY_base_attack",
        sound: "enemy_attack_1",
        description: "A unimpressive attack that deals very little damage.",
        castSelf: false,
        castTime: 0,
        cooldown: 1000,
        repeat: 0,
        repeatInterval: 0,
        range: 0,
        minRange: 3,
        effect: {
            type: "target",
            particule: "damage",
            color: "white",
        },

        affinity: "strength",
        casterPropertyAffected: [],
        targetPropertyAffected: [{ key: "health", type: CALC.REMOVE, min: 1, max: 2 }],
        requiredToLearn: [],
    },

    fireball: {
        title: "Fireball",
        key: "fireball",
        icon: "ICON_ABILITY_fireball",
        sound: "fire_attack_2",
        description: "Hurls a massive fiery ball that explodes on contact with target.",
        castSelf: false,
        castTime: 0,
        cooldown: 1000,
        repeat: 0,
        repeatInterval: 0,
        range: 0,
        minRange: 0,
        effect: {
            type: "travel",
            particule: "fireball",
            color: "orange",
        },

        affinity: "intelligence",
        casterPropertyAffected: [{ key: "mana", type: CALC.REMOVE, min: 10, max: 10 }],
        targetPropertyAffected: [{ key: "health", type: CALC.REMOVE, min: 8, max: 13 }],
        requiredToLearn: [{ key: "level", amount: 2 }],
    },

    poisonball: {
        title: "Poison Cloud",
        key: "poisonball",
        icon: "ICON_ABILITY_poisonball",
        sound: "fire_attack_2",
        description: "Trow a bottle of viscous poisonous liquid onto target that will damage target overtime.",
        castSelf: false,
        castTime: 0,
        cooldown: 5000,
        repeat: 5,
        repeatInterval: 1000,
        range: 0,
        minRange: 0,
        effect: {
            type: "travel",
            particule: "fireball",
            color: "green",
        },
        affinity: "intelligence",
        casterPropertyAffected: [{ key: "mana", type: CALC.REMOVE, min: 15, max: 15 }],
        targetPropertyAffected: [{ key: "health", type: CALC.REMOVE, min: 1, max: 2 }],
        requiredToLearn: [
            { key: "level", amount: 3 },
            { key: "intelligence", amount: 25 },
        ],
    },
    heal: {
        title: "Heal",
        key: "heal",
        icon: "ICON_ABILITY_heal",
        sound: "heal_1",
        description: "A spell from ancient times that will leave target feeling fresh & revigorated.",
        castSelf: false,
        castTime: 0,
        cooldown: 1000,
        repeat: 0,
        repeatInterval: 0,
        range: 0,
        minRange: 0,
        effect: {
            type: "self",
            particule: "heal",
            color: "white",
        },
        affinity: "wisdom",
        casterPropertyAffected: [{ key: "mana", type: CALC.REMOVE, min: 10, max: 10 }],
        targetPropertyAffected: [{ key: "health", type: CALC.ADD, min: 5, max: 10 }],
        requiredToLearn: [
            { key: "level", amount: 5 },
            { key: "intelligence", amount: 25 },
            { key: "wisdom", amount: 35 },
        ],
    },
};

export { AbilitiesDB, Ability, PropertyAffected, CALC };
