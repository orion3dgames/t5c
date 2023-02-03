/**
 * Happy to have experience as set numbers as seen below.
 * Dayd, if you want to make something more dynamic, go ahead ;)
 */

const LEVEL_EXPERIENCE = [
    0,
    1000,
    5713,
    15900,
    32960,
    58137,
    92590,
    137420,
    193690,
    262440
]

export class Leveling {

    public static convertXpToLevel(experience):number {
        let level = 0;
        LEVEL_EXPERIENCE.forEach((v,i) => {
            if(experience >= v){
                level = i+1
            }
        });
        return level;
        
    }

    public static getLevelProgress(experience) {
        let currentLevel = this.convertXpToLevel(experience);
        let xpEarnedThisLevel = experience - LEVEL_EXPERIENCE[currentLevel - 1];
        let xpThisLevel = LEVEL_EXPERIENCE[currentLevel] - LEVEL_EXPERIENCE[currentLevel - 1];
        return xpEarnedThisLevel / xpThisLevel * 100;
      }

}