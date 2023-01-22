let Abilities = {
    "fireball": {
        name: "Fireball",
        key: "fireball",
        icon: "./icons/ABILITY_fireball.png",
        description: "Hurls a massive fiery ball that explodes on contact with target.",
        value: 40,
        type: "direct",
        mana_cost: 20,
        castTime: 1000,
        cooldown: 1000, // 1 seconds
    },  
    "poisonball": {
        name: "Poison Cloud",
        key: "poisonball",
        icon: "./icons/ABILITY_poisonball.png",
        description: "Trow a bottle of viscous poisioneous liquid onto target.",
        value: 5,
        type: "dot",
        castTime: 0,
        cooldown: 5000, // 1 seconds
    },  
    "heal": {
        name: "Heal",
        key: "heal",
        icon: "./icons/ABILITY_heal.png",
        description: "A spell from ancient times that will leave target feeling fresh & revigorated.",
        value: 50,
        type: "heal",
        mana_cost: 40,
        castTime: 1000,
        cooldown: 3000, // 1 seconds
    }, 
}

export default Abilities