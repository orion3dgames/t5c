import { BrainSchema, PlayerSchema } from "../../server/rooms/schema";

export class AttackPositions {
    static updateAvailableAttakPositions(owner) {
        let distance = 1.5;

        // left
        owner.AI_TARGET_ATTACK_SPOTS.set(0, {
            index: 0,
            x: owner.x - distance,
            y: owner.y,
            z: owner.z,
            target: null,
        });

        // right
        owner.AI_TARGET_ATTACK_SPOTS.set(1, {
            index: 1,
            x: owner.x + distance,
            y: owner.y,
            z: owner.z,
            target: null,
        });

        // top
        owner.AI_TARGET_ATTACK_SPOTS.set(2, {
            index: 2,
            x: owner.x,
            y: owner.y,
            z: owner.z - distance,
            target: null,
        });

        // bottom
        owner.AI_TARGET_ATTACK_SPOTS.set(3, {
            index: 3,
            y: owner.y,
            z: owner.z + distance,
            target: null,
        });
    }

    static findNextAvailableAttackPositions(owner: BrainSchema, target: PlayerSchema) {
        if (!target.AI_TARGET_ATTACK_SPOTS) {
            return false;
        }
        if (target.AI_TARGET_ATTACK_SPOTS && target.AI_TARGET_ATTACK_SPOTS.size === 0) {
            return false;
        }
        let found = false;
        target.AI_TARGET_ATTACK_SPOTS.forEach((element) => {
            if (found === false && element.target === null) {
                element.target = owner;
                found = element;
            }
        });
        return found;
    }

    static removeTargetFromAttackSpot(owner: BrainSchema, target: PlayerSchema) {
        let targetSpotIndex = owner.AI_TARGET_SPOT.index ?? null;
        if (targetSpotIndex !== null) {
            console.log("removeTargetFromAttackSpot", targetSpotIndex);
            target.AI_TARGET_ATTACK_SPOTS.get(owner.AI_TARGET_SPOT.index).target = null;
        }
    }
}
