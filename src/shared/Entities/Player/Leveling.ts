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
        let xpEarned = experience;
        let xpMin = LEVEL_EXPERIENCE[currentLevel-1];
        let xpMax = LEVEL_EXPERIENCE[currentLevel];
        // daydd a toi de bosser la, il faut retourner le pourcentage pour que je puisse afficher la progression du level
        //console.log((xpEarned/xpMin) - (xpMax-xpMin) * 100);
    }

}