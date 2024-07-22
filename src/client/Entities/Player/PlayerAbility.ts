import { Scene } from "@babylonjs/core/scene";
import { Player } from "../Player";
import { PlayerInput } from "../../Controllers/PlayerInput";
import { Ability, ServerMsg } from "../../../shared/types";

export class PlayerAbility {
    private player: Player;
    private _scene: Scene;
    private _input: PlayerInput;

    public isCasting: boolean = false;
    public castingDigit: number = 0;
    public castingTimer;
    public castingElapsed: number = 0;
    public castingTarget: number = 0;
    public ability_in_cooldown;

    constructor(player) {
        this.player = player;
        this._scene = player._scene;
        this._input = player._input;

        this.ability_in_cooldown = [false, false, false, false, false, false, false, false, false, false, false];
    }

    public update(delta) {
        ///////////// ABILITY & CASTING EVENTS ///////////////////////////
        // if digit pressed
        if (this._input.digit_pressed > 0 && !this.isCasting) {
            this.sendToServer();
        }

        // check if casting
        if (this.isCasting === true) {
            // increment casting timer
            this.player._ui._CastingBar.open();
            this.castingElapsed += delta; // increment casting timer by server delta
            let widthInPercentage = ((this.castingElapsed / this.castingTarget) * 100) / 100; // percentage between 0 and 1
            let text = this.castingElapsed + "/" + this.castingTarget;
            let width = widthInPercentage;
            this.player._ui._CastingBar.update(text, width);
        }

        // check for cooldowns (aistethic only as server really controls cooldowns)
        this.ability_in_cooldown.forEach((cooldown, digit) => {
            if (cooldown > 0) {
                let cooldownUI = this.player._ui.MAIN_ADT.getControlByName("ability_" + digit + "_cooldown");
                let ability = this.getAbilityByDigit(digit) as Ability;
                if (ability && cooldownUI) {
                    this.ability_in_cooldown[digit] -= delta;
                    let percentage = ((this.ability_in_cooldown[digit] / ability.cooldown) * 100) / 100;
                    cooldownUI.height = percentage;
                }
            }
        });
    }

    public sendToServer() {
        // get all necessary vars
        let digit = this._input.digit_pressed;
        let target = this.player._game.selectedEntity;

        // send to server
        this.player._game.sendMessage(ServerMsg.PLAYER_HOTBAR_ACTIVATED, {
            senderId: this.player._room.sessionId,
            targetId: target ? target.sessionId : false,
            digit: digit,
        });

        // clear digit
        this._input.digit_pressed = 0;
    }

    public getAbilityByDigit(digit): Ability | boolean {
        let found = false;
        this.player.player_data.hotbar.forEach((element) => {
            if (element.digit === digit) {
                found = this.player._game.getGameData("ability", element.key);
            }
        });
        return found;
    }

    // player is casting
    public startCasting(data) {
        let digit = data.digit;
        let ability = this.getAbilityByDigit(digit) as Ability;
        if (ability) {
            this.isCasting = true;
            this.castingElapsed = 0;
            this.castingTarget = ability.castTime;
            this.castingDigit = digit;
            this.player._ui._CastingBar.open();
        }
    }

    // player cancel casting
    public stopCasting(data) {
        this.isCasting = false;
        this.castingElapsed = 0;
        this.castingTarget = 0;
        this.castingDigit = 0;
        this.player._ui._CastingBar.close();
    }

    // process server casting events
    public processServerCasting(data) {
        let ability = this.player._game.getGameData("ability", data.key);
        if (ability) {
            // if you are sender, cancel casting and strat cooldown on client
            if (data.fromId === this.player.sessionId) {
                // cancel casting
                this.castingElapsed = 0;
                this.castingTarget = 0;
                this.isCasting = false;
                this.player._ui._CastingBar.close();
                this.ability_in_cooldown[data.digit] = ability.cooldown; // set cooldown
            }

            // action ability
            this.player.actionsController.process(this, data, ability);
        }
    }
}
