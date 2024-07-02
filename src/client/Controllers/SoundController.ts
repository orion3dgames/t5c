import { Sound } from "@babylonjs/core/Audio/sound";
import { GameController } from "./GameController";

export class SoundController {
    public _game: GameController;
    public volume: number = 0.2;

    constructor(game) {
        this._game = game;
    }

    play(key: string, loop: boolean = false): void {
        console.log("[SOUND] playing " + key);
        // start  music
        let soundData = this._game._loadedAssets[key];
        let sound = new Sound(
            key,
            soundData,
            this._game.scene,
            function () {
                sound.play();
            },
            {
                volume: this.volume,
                loop: loop,
            }
        );
    }
}
