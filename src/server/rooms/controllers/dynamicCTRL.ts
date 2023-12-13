import { Leveling } from "../../../shared/Class/Leveling";
import { Quest, QuestObjective, QuestStatus, QuestUpdate, ServerMsg } from "../../../shared/types";
import { BrainSchema, LootSchema, PlayerSchema, QuestSchema } from "../schema";
import { GameRoomState } from "../state/GameRoomState";

export class dynamicCTRL {
    private _state: GameRoomState;
    private _player: PlayerSchema;
    private _dynamic;

    constructor(player) {
        this._player = player;
        this._state = player._state;
    }

    public update() {
        //
        let interactive = this._state.roomDetails.dynamic.interactive ?? [];
        if (interactive.length > 0) {
            let currentPos = this._player.getPosition();
            interactive.forEach((element) => {
                let distanceTo = currentPos.distanceTo(element.from);

                if (distanceTo < 2) {
                    if (element.type === "teleport") {
                        this._player.x = element.to_vector.x;
                        this._player.y = element.to_vector.y;
                        this._player.z = element.to_vector.z;
                    }

                    if (element.type == "zone_change" && this._player.isTeleporting === false) {
                        this._player.isTeleporting = true;

                        let client = this._state._gameroom.clients.getById(this._player.sessionId);

                        // update player location in database
                        this._player.location = element.to_map;
                        this._player.x = element.to_vector.x;
                        this._player.y = element.to_vector.y;
                        this._player.z = element.to_vector.z;
                        this._player.rot = 0;

                        // save player before leaving
                        const playerState: PlayerSchema = this._state.getEntity(client.sessionId) as PlayerSchema;
                        playerState.save(this._state._gameroom.database);

                        // inform client he cand now teleport to new zone
                        client.send(ServerMsg.PLAYER_TELEPORT, element.to_map);
                    }
                }
            });
        }
    }

    ////////////////////////////////
    //////////// QUESTS /////////////
    ////////////////////////////////

    // check quest update
    // note: currently called from abilityCtrl when a entity dies
    checkQuestUpdate(type, target: BrainSchema) {
        //
        if (type === "kill" && target.AI_SPAWN_INFO) {
            this._player.player_data.quests.forEach((element: QuestSchema) => {
                if (element.type === QuestObjective.KILL_AMOUNT && element.spawn_key === target.AI_SPAWN_INFO.key) {
                    element.qty++;
                }
            });
        }
    }

    isQuestReadyToComplete(quest: Quest) {
        let pQuest = this._player.player_data.quests[quest.key];
        if (quest && pQuest) {
            if (quest.type === QuestObjective.KILL_AMOUNT && pQuest.qty >= quest.quantity && pQuest.status === 0) {
                return true;
            }
        }
        return false;
    }

    questUpdate(data: QuestUpdate) {
        let quest = this._state.gameData.get("quest", data.key) as Quest;

        if (!quest) {
            return false;
        }

        if (data.status === QuestStatus.OBJECTIVE_UPDATE) {
        }

        if (data.status === QuestStatus.ACCEPTED) {
            this._player.player_data.quests.set(quest.key, new QuestSchema(quest));
        }

        if (data.status === QuestStatus.READY_TO_COMPLETE) {
            // check is quest in complete
            if (!this.isQuestReadyToComplete(quest)) return false;

            // find player quest
            let playerQuest = this._player.player_data.quests.get(data.key);

            // experience
            let experienceReward = quest.rewards.experience ?? 0;
            if (experienceReward) {
                Leveling.addExperience(this._player, experienceReward);
            }

            // gold
            let goldReward = quest.rewards.gold ?? 0;
            if (goldReward) {
                this._player.player_data.gold += goldReward;
            }

            // add items
            let items = quest.rewards.items ?? [];
            items.forEach((item) => {
                this._player.pickupItem(new LootSchema(this._state, item));
            });

            // remove quest as it is completed
            // later on we will save a history, not necessary yet..
            //this._player.player_data.quests.delete(quest.key);
            playerQuest.status = 1;
        }
    }
}
