import { roundTo } from "../../Utils";

const LEVEL_MODIFIER = 0.05;

export class Leveling {

    public static convertXpToLevel(xp):number {
        // Level = 0.05 * sqrt(xp)
        return (LEVEL_MODIFIER * Math.sqrt(xp));
    }

    public static convertLevelToXp(level:number):number {
        // XP = (Level / 0.05) ^ 2
        return roundTo(Math.pow(level / LEVEL_MODIFIER, 2), 0);
    }

    public static getLevel(xp):number {
        return roundTo(this.convertXpToLevel(xp), 0);
    }

    public static getLevelProgress(xp):number {
        let currentXP = xp;
        let currentLevelXP = this.convertLevelToXp(this.getLevel(xp));
        let nextLevelXP = this.convertLevelToXp(this.getLevel(xp) + 1);
        let neededXP = nextLevelXP - currentLevelXP;
        let earnedXP = nextLevelXP - currentXP;
        return roundTo(100 - Math.ceil((earnedXP / neededXP) * 100), 0);
    }

}