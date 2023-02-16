type Drops = {
    min: number;
    max: number;
    change: number;
};

type Race = {
    title: string;
    speed: number;
    scale: number;
    rotationFix: number;
    animationSpeed: number;
    animations: {
        [key: string]: number;
    };
    baseHealth: number;
    baseMana: number;
    healthRegen: number;
    manaRegen: number;
    experienceGain: number;
    goldGain: {};
    damage_multiplier: number;
    abilities: {
        [key: number]: string;
    };
    drops?: {
        [key: string]: any;
    };
};

interface raceDataMap {
    [key: string]: Race;
}

let RacesDB: raceDataMap = {
    player_hobbit: {
        title: "Hobbit",
        speed: 0.6,
        scale: 0.02,
        rotationFix: 0,
        animationSpeed: 1.3,
        animations: {
            IDLE: 3,
            WALK: 6,
            ATTACK: 0,
            DEATH: 2,
            DAMAGE: 1,
        },
        baseHealth: 100,
        baseMana: 100,
        healthRegen: 0.2,
        manaRegen: 0.4, // per second
        experienceGain: 0,
        goldGain: {},
        damage_multiplier: 0,
        abilities: {
            1: "base_attack",
            2: "fireball",
            3: "poisonball",
            4: "heal",
        },
        drops: {},
    },
    monster_bear: {
        title: "Bear",
        speed: 0.2,
        scale: 0.02,
        rotationFix: 3.14,
        animationSpeed: 1,
        animations: {
            IDLE: 0,
            WALK: 3,
            ATTACK: 2,
            DEATH: 4,
            DAMAGE: 5,
        },
        baseHealth: 200,
        baseMana: 100,
        healthRegen: 0.2,
        manaRegen: 0.4, // per second
        experienceGain: 2000,
        goldGain: { min: 120, max: 250 },
        damage_multiplier: 1.3,
        abilities: {
            1: "base_attack",
        },
        drops: {
            apples: { min: 1, max: 1, chance: 0.2 },
            pears: { min: 1, max: 10, chance: 0.1 },
        },
    },
    monster_unicorn: {
        title: "Unicorn",
        speed: 0.3,
        scale: 0.0125,
        rotationFix: 3.14,
        animationSpeed: 1,
        animations: {
            IDLE: 5,
            WALK: 6,
            ATTACK: 0,
            DEATH: 3,
            DAMAGE: 5,
        },
        baseHealth: 100,
        baseMana: 100,
        healthRegen: 0.2,
        manaRegen: 0.4, // per second
        experienceGain: 1000,
        goldGain: { min: 45, max: 75 },
        damage_multiplier: 1,
        abilities: {
            1: "base_attack",
            2: "fireball",
        },
        drops: {
            apples: { min: 1, max: 1, chance: 0.2 },
            pears: { min: 1, max: 10, chance: 0.1 },
        },
    },
};

export { RacesDB, Race };
