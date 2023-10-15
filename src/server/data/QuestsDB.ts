import { QuestObjective } from "../../shared/types";

let QuestsDB = {
    LH_DANGEROUS_ERRANDS_01: {
        key: "LH_DANGEROUS_ERRANDS_01", // unique id
        title: "Dangerous Errands",
        description:
            "If you have a moment, I must confess our temple is currently plagued by a bandit plague. They're roaming outside the temple creating havoc. Perhaps you could offer some assistance in this matter?",
        descriptionOngoing: "Come back to me when you have killed @KillRemaining more bandits.",
        descriptionReward: "Thank you so much looking after my bandits problem.  Please accept this small token of my appreciation.",
        descriptionCompleted: "Thank you so much looking after my bandits problem.",
        objective: "@NpcName in @LocationName wants you to kill @KillRequired @KillName found a little to the east of lighthaven temple.",
        type: QuestObjective.KILL_AMOUNT,
        location: "lh_town",
        spawn_type: "lh_town_bandits",
        spawn_name: "Bandit",
        quantity: 1,
        isRepeatable: true,
        reward: {
            experience: 500,
            gold: 50,
            items: [],
        },
    },
};

export { QuestsDB };
