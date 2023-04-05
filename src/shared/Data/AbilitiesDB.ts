type Ability = {
    // unique key
    key: string;

    // relative link to icon
    icon: string;

    // sound effect
    sound: string;

    // ability title
    label: string;

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

    // what properties will affect caster
    casterPropertyAffected: {
        [key: string]: number;
    };

    // what properties will affect caster
    targetPropertyAffected: {
        [key: string]: number;
    };

    // what properties a player must have to learn this ability
    requiredToLearn: {
        [key: string]: number;
    };
};

interface abilityMap {
    [key: string]: Ability;
}

let AbilitiesDB: abilityMap = {
    base_attack: {
        label: "Attack",
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
        casterPropertyAffected: {},
        targetPropertyAffected: {
            health: -10,
        },
        requiredToLearn: {},
    },
    fireball: {
        label: "Fireball",
        key: "fireball",
        icon: "ICON_ABILITY_fireball",
        sound: "fire_attack_2",
        description: "Hurls a massive fiery ball that explodes on contact with target.",
        castSelf: false,
        castTime: 1000,
        cooldown: 2000,
        repeat: 0,
        repeatInterval: 0,
        range: 2,
        minRange: 0,
        effect: {
            type: "travel",
            particule: "fireball",
            color: "orange",
        },
        casterPropertyAffected: {
            mana: 10,
        },
        targetPropertyAffected: {
            health: -50,
        },
        requiredToLearn: {
            level: 3,
        },
    },
    poisonball: {
        label: "Poison Cloud",
        key: "poisonball",
        icon: "ICON_ABILITY_poisonball",
        sound: "fire_attack_2",
        description: "Trow a bottle of viscous poisonous liquid onto target that will damage target overtime.",
        castSelf: false,
        castTime: 0,
        cooldown: 6000,
        repeat: 5,
        repeatInterval: 1000,
        range: 0,
        minRange: 0,
        effect: {
            type: "travel",
            particule: "fireball",
            color: "green",
        },
        casterPropertyAffected: {
            mana: 20,
        },
        targetPropertyAffected: {
            health: -10,
        },
        requiredToLearn: {
            level: 5,
        },
    },
    heal: {
        label: "Heal",
        key: "heal",
        icon: "ICON_ABILITY_heal",
        sound: "heal_1",
        description: "A spell from ancient times that will leave target feeling fresh & revigorated.",
        castSelf: true,
        castTime: 3000,
        cooldown: 5000,
        repeat: 0,
        repeatInterval: 0,
        range: 0,
        minRange: 0,
        effect: {
            type: "self",
            particule: "heal",
            color: "white",
        },
        casterPropertyAffected: {
            mana: 20,
        },
        targetPropertyAffected: {
            health: 50,
        },
        requiredToLearn: {
            level: 4,
            intelligence: 18,
            wisdom: 24,
        },
    },
};

export { AbilitiesDB, Ability };
