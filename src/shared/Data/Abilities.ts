let Abilities = {
    "fireball": {
        name: "Fireball",
        key: "fireball",
        icon: "./icons/ABILITY_fireball.png",
        description: "Hurls a massive fiery ball that explodes on contact with target.",
        value: 100,
        type: "direct",
        manaCost: 20,
        castTime: 0,
        cooldown: 1000, // 1 seconds
        propertyAffected: 'health'
    },  
    "poisonball": {
        name: "Poison Cloud",
        key: "poisonball",
        icon: "./icons/ABILITY_poisonball.png",
        description: "Trow a bottle of viscous poisonous liquid onto target that will damage target overtime.",
        value: 10,
        type: "dot",
        manaCost: 60,
        castTime: 0,
        cooldown: 5000, // 1 seconds
        dotInterval: 1000,
        propertyAffected: 'health'
    },  
    "heal": {
        name: "Heal",
        key: "heal",
        icon: "./icons/ABILITY_heal.png",
        description: "A spell from ancient times that will leave target feeling fresh & revigorated.",
        value: 50,
        type: "heal",
        manaCost: 40,
        castTime: 0,
        cooldown: 3000, // 1 seconds
        propertyAffected: 'health'
    }, 
}

export default Abilities