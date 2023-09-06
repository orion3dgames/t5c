import { roundTo } from "../../Utils";

// level progression
const LEVEL_EXPERIENCE = [
    0, // Level 1
    1000, // Level 2
    5713, // Level 3
    15900, // Level 4
    32960, // Level 5
    58137, // Level 6
    92590, // Level 7
    137420, // Level 8
    193690, // Level 9
    262440, // Level 10
];

export class Leveling {
    /**
     * return total xp required for level
     * @param level
     * @returns level number
     */
    public static getTotalLevelXp(level: number): number {
        return LEVEL_EXPERIENCE[level];
    }

    /**
     * convert experience to level (eg: 500 xp would return level 1)
     * @param experience
     * @returns level number
     */
    public static convertXpToLevel(experience: number): number {
        let level = 0;
        LEVEL_EXPERIENCE.forEach((v, i) => {
            if (experience >= v) {
                level = i + 1;
            }
        });
        return level;
    }

    /**
     * check if player has levelled up
     * @param currentLevel
     * @param currentExperience
     * @param amount
     * @returns boolean (true if player has levelled up, false otherwise)
     */
    public static doesPlayerlevelUp(currentLevel: number, currentExperience: number, amount: number) {
        let newExperience = currentExperience + amount;
        let nextExpCap = LEVEL_EXPERIENCE[currentLevel];
        if (newExperience >= nextExpCap) {
            return true;
        }
        return false;
    }

    /**
     * returns current level progress as a percentage
     * @param experience
     * @returns percentage
     */
    public static getLevelProgress(experience: number) {
        let currentLevel = this.convertXpToLevel(experience);
        let xpEarnedThisLevel = experience - LEVEL_EXPERIENCE[currentLevel - 1];
        let xpThisLevel = LEVEL_EXPERIENCE[currentLevel] - LEVEL_EXPERIENCE[currentLevel - 1];
        return roundTo((xpEarnedThisLevel / xpThisLevel) * 100, 0);
    }
}
