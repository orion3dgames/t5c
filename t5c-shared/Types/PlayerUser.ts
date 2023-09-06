import { PlayerCharacter } from "./PlayerCharacter";
export type PlayerUser = {
    id: number;
    username: string;
    password: string;
    token: string;
    characters?: PlayerCharacter[];
};
