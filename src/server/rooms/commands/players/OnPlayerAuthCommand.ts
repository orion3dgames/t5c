import { Command } from "@colyseus/command";
import { GameRoom } from "../../GameRoom";
import Logger from "../../../../shared/Logger";

class OnPlayerAuthCommand extends Command<GameRoom, { character: any }> {
    execute(character) {

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
        Logger.info("[gameroom][onAuth] client authentified.", character);
        return true;
    }
}

export { OnPlayerAuthCommand };
