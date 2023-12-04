import { QuestObjective } from "../../shared/types";

let QuestsDB = {
    LH_DANGEROUS_ERRANDS_01: {
        key: "LH_DANGEROUS_ERRANDS_01", // unique id
        title: "Dangerous Errands",
        description:
            "If you have a moment, our temple is currently plagued by a bandit invasion and they're roaming outside the temple creating havoc. Perhaps you could offer some assistance in this matter?",
        objective: "@NpcName in @LocationName wants you to kill @KillRequired @TargetName found a little to the east of lighthaven temple.",
        type: QuestObjective.KILL_AMOUNT,
        location: "lh_town",
        spawn_key: "lh_town_bandits",
        quantity: 5,
        isRepeatable: false,
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
        objective: "@NpcName in @LocationName wants you to kill the @TargetName roaming the montains in the west of lighthaven temple.",
        type: QuestObjective.KILL_AMOUNT,
        location: "lh_town",
        spawn_key: "lh_town_thief",
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
    LH_DANGEROUS_ERRANDS_03: {
        key: "LH_DANGEROUS_ERRANDS_03", // unique id
        title: "Find Alexander The Righteous",
        description:
            "a very close friend of mine called Alexander has been since a few days, could you find him for me? He was last seen heading to the mountains to find monsters.",
        objective: "@NpcName in @LocationName wants you to find @TargetName in the mountains to the west of the temple.",
        type: QuestObjective.TALK_TO,
        location: "lh_town",
        spawn_key: "lh_town_alexander",
        quantity: 1,
        isRepeatable: false,
        rewards: {
            experience: 10000,
        },
    },
};

export { QuestsDB };
