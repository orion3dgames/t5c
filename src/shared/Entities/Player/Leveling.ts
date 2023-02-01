const LEVEL_MODIFIER = 0.05;

export class Leveling {

    public static round(xp):number {
        return parseFloat(xp.toFixed(0));
    }

    public static convertXpToLevel(xp):number {
        return this.round( (LEVEL_MODIFIER * Math.sqrt(xp) ) );
    }

    public static convertLevelToXp(level:number):number {
        return this.round( Math.pow(level / LEVEL_MODIFIER, 2) );
    }

    public static getLevel(xp):number {
        return this.round( this.convertXpToLevel(xp) );
    }

    public static getLevelProgress(xp):number {
        let currentXP = xp;
        let currentLevelXP = this.convertLevelToXp(this.getLevel(xp));
        let nextLevelXP = this.convertLevelToXp(this.getLevel(xp) + 1);
        let neededXP = nextLevelXP - currentLevelXP;
        let earnedXP = nextLevelXP - currentXP;
        return this.round( 100 - Math.ceil((earnedXP / neededXP) * 100) );
    }

}