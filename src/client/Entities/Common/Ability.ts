import { EntityState } from "../../../shared/types";

export class Ability {
    // unique key
    public key: string;

    // relative link to icon
    public icon: string;

    // sound effect
    public sound: string;

    // ability title
    public name: string = "";

    // ability description
    public description: string = "";

    // can ability be cast on self ? true or false
    public castSelf: boolean = false;

    // cast time in milliseconds
    public castTime: number = 0;

    // cooldown period in milliseconds
    public cooldown: number = 0;

    // number of time this ability should repeat
    public repeat: number = 1;

    // interval this ability should repeat in milliseconds
    public repeatInterval: number = 0;

    // range this ability affects (any entity in this range will be affected the same)
    public range: number = 0;

    // min range target must be (if entity is further, prevent casting)
    public minRange: number = 0;

    // animation to play
    animation: EntityState;

    // the effect that will happen when the ability is played
    public effect: {
        type?: string; // travel or self
        particule?: string; // choose from list of particule effects
        color?: string; // main color of effect
    } = {};

    // what properties will affect caster
    public casterPropertyAffected: {
        [key: string]: number;
    } = {};

    // what properties will affect caster
    public targetPropertyAffected: {
        [key: string]: number;
    } = {};

    // what properties a player must have to learn this ability
    public requiredToLearn: {
        [key: string]: number;
    } = {};

    public inCooldown: boolean = false;

    constructor(props) {
        Object.assign(this, props);
    }
}
