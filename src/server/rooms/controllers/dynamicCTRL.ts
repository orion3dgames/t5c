import { ServerMsg } from "../../../shared/types";
import { BrainSchema, PlayerSchema } from "../schema";
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
                        this._state._gameroom.database.updateCharacter(this._player.id, this);

                        // inform client he cand now teleport to new zone
                        client.send(ServerMsg.PLAYER_TELEPORT, element.to_map);
                    }
                }
            });
        }

        //
        if (this._player.interactingTarget) {
            // check distance
            let distance = this._player.getPosition().distanceTo(this._player.interactingTarget.getPosition());
            if (distance > 5) {
                this.endInteraction();
            }
        }
    }

    public endInteraction() {
        this._player.interactingStep = 0;
        this._player.interactingTarget = null;
        this._player.isInteracting = null;
        let client = this._player.getClient();
        client.send(ServerMsg.ENTITY_INTERACT_END);
        console.log("--------------- DIALOG ENDED --------------------");
    }

    public process(sessionId) {
        console.log("Player " + this._player.name + " has clicked on ", sessionId);

        let target: BrainSchema = this._state.entityCTRL.get(sessionId) as BrainSchema;
        this._player.interactingTarget = target;

        if (target) {
            // nothing happens when you click on yourself
            if (target.sessionId === this._player.sessionId) return false;

            // only continue if you click on a entity (not player or item)
            if (target.type !== "entity") return false;

            // only proceed if interactable is set
            if (!target.AI_SPAWN_INFO.interactable) return false;

            // check distance
            let distance = this._player.getPosition().distanceTo(target.getPosition());
            if (distance > 5) return false;

            // get details
            let interactable = target.AI_SPAWN_INFO.interactable;
            if (interactable) {
                if (interactable.type === "dialog") {
                    //
                    console.log("--------------- DIALOG STARTED --------------------");

                    // start dialog
                    this._player.interactingStep = 0;
                    let dialogData = interactable.data[this._player.interactingStep];
                    this._player.isInteracting = dialogData;

                    // replace keywords
                    let dialogText = dialogData.text;
                    dialogText = dialogText.replace("@PlayerName", this._player.name);

                    // send event to player
                    let client = this._player.getClient();
                    client.send(ServerMsg.ENTITY_INTERACT_NEXT, {
                        text: dialogText,
                        buttons: dialogData.buttons ?? [],
                    });
                }
            }
        }

        /*
        distance: 2,
        type: "dialog",
        data: [
            {
                text: "Hi, I'm a target practise dummy, welcome @PlayerName ",
                buttons: [{ label: "Welcome", goToDialog: 1 }],
            },
            {
                text: "Are you in search of healing?",
                buttons: [
                    { label: "Yes", goToDialog: 2 },
                    { label: "No", goToDialog: 3 },
                ],
            },
            {
                text: "Ok, please do not move while I heal you!",
                isEndOfDialog: true,
                triggeredByClosing: (owner) => {
                    owner.heal();
                },
            },
            {
                text: "Oh!, Do come back when you're in need.",
                isEndOfDialog: true,
            },
        ],*/
    }
}
