type Ability = {

    // unique key 
    key: string, 

    // relative link to icon
    icon: string, 
    
    // ability title
    name: string, 

    // ability description
    description: string,

    // can ability be cast on self ? true or false
    castSelf: boolean,

    // cast time in milliseconds
    castTime: number, 

    // cooldown period in milliseconds
    cooldown: number, 
    
    // number of time this ability should repeat
    repeat: number, 

    // interval this ability should repeat in milliseconds
    repeatInterval: number, 

    // range this ability affects (any entity in this range will be affected the same)
    range: number, 

    // the effect that will happen when the ability is played
    effect: {
        type?: string, // travel or self
        particule?: string, // choose from list of particule effects
        color?: string // main color of effect
    },

    // what properties will affect caster
    casterPropertyAffected: {
        [key: string]: number
    },

    // what properties will affect caster
    targetPropertyAffected: {
        [key: string]: number
    },

    // what properties a player must have to learn this ability
    requiredToLearn: {
        [key: string]: number
    }
};

interface abilityMap {
    [key: string]: Ability
 }

let Abilities:abilityMap = {
    "base_attack": {
        name: "Attack",
        key: "base_attack",
        icon: "./icons/ABILITY_base_attack.png",
        description: "A unimpressive attack that deals very little damage.",
        castSelf: false,
        castTime: 0,
        cooldown: 800,
        repeat: 0,
        repeatInterval: 0,
        range: 0,
        effect: {
            type: 'target',
            particule: 'damage',
            color: 'white'
        },
        casterPropertyAffected: {},
        targetPropertyAffected: {
            'health': -10,
        },
        requiredToLearn: {},
    },  
    "fireball": {
        name: "Fireball",
        key: "fireball",
        icon: "./icons/ABILITY_fireball.png",
        description: "Hurls a massive fiery ball that explodes on contact with target.",
        castSelf: false,
        castTime: 1000,
        cooldown: 1000,
        repeat: 0,
        repeatInterval: 0,
        range: 0,
        effect: {
            type: 'travel',
            particule: 'fireball',
            color: 'orange'
        },
        casterPropertyAffected: {
            'mana': 10,
        },
        targetPropertyAffected: {
            'health': -50,
        },
        requiredToLearn: {
            'level': 3,
        },
    },  
    "poisonball": {
        name: "Poison Cloud",
        key: "poisonball",
        icon: "./icons/ABILITY_poisonball.png",
        description: "Trow a bottle of viscous poisonous liquid onto target that will damage target overtime.",
        castSelf: false,
        castTime: 0,
        cooldown: 5000,
        repeat: 5,
        repeatInterval: 1000,
        range: 0,
        effect: {
            type: 'travel',
            particule: 'fireball',
            color: 'green'
        },
        casterPropertyAffected: {
            'mana': 20,
        },
        targetPropertyAffected: {
            'health': -10,
        },
        requiredToLearn: {
            'level': 5,
        },
    },  
    "heal": {
        name: "Heal",
        key: "heal",
        icon: "./icons/ABILITY_heal.png",
        description: "A spell from ancient times that will leave target feeling fresh & revigorated.",
        castSelf: true,
        castTime: 2000,
        cooldown: 3000,
        repeat: 0,
        repeatInterval: 0,
	    range: 0,
        effect: {
            type: 'self',
            particule: 'heal',
            color: 'white'
        },
        casterPropertyAffected: {
            'mana': 20,
        },
        targetPropertyAffected: {
            'health': 50,
        },
        requiredToLearn: {
            'level': 4,
            'intelligence': 18,
            'wisdom': 24,
        },
    }, 
}

export {
    Abilities,
    Ability
}