import Logger from "../../utils/Logger";

class Auth {
    static async check(db, authData) {
        const character = await db.getCharacter(authData.character_id);

        if (!character) {
            Logger.error("[gameroom][onAuth] client could not authentified, joining failed.", character.character_id);
            return false;
        }

        // character found, check if already logged in
        if (character.online > 0) {
            Logger.error("[gameroom][onAuth] client already connected. ", character);
            return false;
        }

        // all checks are good, proceed
        Logger.info("[gameroom][onAuth] client authentified.");
        return character;
    }
}

export { Auth };
