import { QuestObjective } from "../../shared/types";

let QuestsDB = {
    LH_DANGEROUS_ERRANDS_01: {
        key: "LH_DANGEROUS_ERRANDS_01", // unique id
        title: "Dangerous Errands",
        description:
            "If you have a moment, our temple is currently plagued by a bandit invasion and they're roaming outside the temple creating havoc. Perhaps you could offer some assistance in this matter?",
        descriptionOngoing: "Come back to me when you have killed @KillRemaining more bandits.",
        descriptionReward: "Thank you so much looking after my bandits problem.  Please accept this small token of my appreciation.",
        descriptionCompleted: "Thank you so much looking after my bandits problem.",
        objective: "@NpcName in @LocationName wants you to kill @KillRequired @KillName found a little to the east of lighthaven temple.",
        short_objective: "Kill @KillName @KillCompleted/@KillRequired",
        type: QuestObjective.KILL_AMOUNT,
        location: "lh_town",
        spawn_type: "lh_town_bandits",
        spawn_name: "Bandit",
        quantity: 5,
        isRepeatable: true,
        rewards: {
            experience: 500,
            gold: 50,
            items: [],
        },
    },
    LH_DANGEROUS_ERRANDS_02: {
        key: "LH_DANGEROUS_ERRANDS_02", // unique id
        title: "Highway Patrol Thief",
        description: "There is roaming in the mountains close by, please deal with him and I'll reward you.",
        descriptionOngoing: "Come back to me when you have killed the thief.",
        descriptionReward: "Thank you so much for dealing with that thief, the roads are safer now. Here you are: ",
        descriptionCompleted: "Thank you so much looking after my thief problem.",
        objective: "@NpcName in @LocationName wants you to kill the thief roaming the montains in the west of lighthaven temple.",
        short_objective: "Kill @KillName @KillCompleted/@KillRequired",
        type: QuestObjective.KILL_AMOUNT,
        location: "lh_town",
        spawn_type: "lh_town_thief",
        spawn_name: "Thief",
        quantity: 1,
        isRepeatable: true,
        rewards: {
            experience: 1000,
            gold: 250,
            items: [
                {
                    key: "sword_01",
                    qty: 1,
                },
            ],
        },
    },
};

export { QuestsDB };
