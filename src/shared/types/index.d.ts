import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import State from "../../client/Screens/Screens";
import { Entity } from "../Entities/Entity";

export { PlayerInputs, PlayerLocation, PlayerMessage, PlayerUser, PlayerCharacter };

type PlayerInputs = {
    seq: number;
    h: number;
    v: number;
};

type PlayerLocation = {
    title: string;
    mesh: string;
    key: string;
    spawnPoint: Vector3;
};

type PlayerMessage = {
    type: string;
    senderID: string;
    name: string;
    message: string;
    timestamp: number;
    createdAt: string;
    color: string;
};

type PlayerUser = {
    id: number;
    username: string;
    password: string;
    token: string;
    characters?: PlayerCharacter[];
};

type PlayerCharacter = {
    id: number;
    user_id: number;
    name: string;
    location: string;
    x: number;
    y: number;
    z: number;
    rot: number;
    online: number;
    health: number;
    mana: number;
    level: number;
    experience: number;
};

declare global {
    interface T5C {
        nextScene: State;
        currentRoomID: string;
        currentSessionID: string;
        currentLocation: PlayerLocation;
        currentUser: PlayerUser;
        currentCharacter: PlayerCharacter;
        selectedEntity: Entity;
        locale: "en";
        currentMs: number;
        camY: number;
    }
}
