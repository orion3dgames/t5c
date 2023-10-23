export class QuestsHelper {
    public static findQuestTargetName(location, targetName, quantity): string {
        let spawns = location.dynamic.spawns ?? [];
        let found = "";
        spawns.forEach((element) => {
            if (element.key === targetName) {
                found = element.name;
            }
        });
        if (quantity > 1) {
            found += "s";
        }
        return found;
    }
}
