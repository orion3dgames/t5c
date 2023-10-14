import { QuestObjective } from "../../shared/types";

let QuestsDB = {
    LH_DANGEROUS_ERRANDS_01: {
        key: "LH_DANGEROUS_ERRANDS_01", // unique id
        title: "Dangerous Errands",
        description:
            "If you have a moment, I must confess our temple is currently plagued by a bandit plague. They're roaming outside the temple creating havoc. Perhaps you could offer some assistance in this matter?",
        objective: "@NpcName in @LocationName wants you to kill @KillAmount @KillName found a little to the east of lighthaven temple.",
        type: QuestObjective.KILL_AMOUNT,
        location: "lh_town",
        spawn_type: "lh_town_bandits",
        quantity: 10,
        experienceOnCompletion: 1000,
        isRepeatable: true,
    },
};

export { QuestsDB };
