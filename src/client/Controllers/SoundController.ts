import { Sound } from "@babylonjs/core/Audio/sound";
import { GameController } from "./GameController";
import { GameScene } from "../Screens/GameScene";

export class SoundController {
    public _gamescene: GameScene;
    public volume: number = 0.2;
    public sounds = new Map();

    constructor(gamescene) {
        this._gamescene = gamescene;
    }

    play(key: string, loop: boolean = false): void {
        // start  music
        console.log("[SOUND] loading " + key);
        if (!this.sounds.has(key)) {
            let soundData = this._gamescene._game._loadedAssets[key];
            let sound = new Sound(
                key,
                soundData,
                this._gamescene._scene,
                () => {
                    this.sounds.set(key, sound);
                    sound.play();
                    //console.log("[SOUND] playing " + key, sound);
                },
                {
                    volume: this.volume,
                    loop: loop,
                }
            );
        } else {
            this.sounds.get(key).play(loop);
            //console.log("[SOUND] playing from cache " + key);
        }
    }
}
