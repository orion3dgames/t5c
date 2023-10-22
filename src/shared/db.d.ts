import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export interface CharacterAbilities {
  digit: Generated<number | null>;
  id: Generated<number | null>;
  key: string | null;
  owner_id: number | null;
}

export interface CharacterEquipment {
  id: Generated<number | null>;
  key: string | null;
  owner_id: number | null;
  slot: number | null;
}

export interface CharacterInventory {
  id: Generated<number | null>;
  key: string | null;
  order: number | null;
  owner_id: number | null;
  qty: number | null;
}

export interface CharacterQuests {
  id: Generated<number | null>;
  key: string | null;
  owner_id: number | null;
  qty: Generated<number | null>;
  status: Generated<number | null>;
}

export interface Characters {
  agility: Generated<number | null>;
  endurance: Generated<number | null>;
  experience: string | null;
  gold: Generated<number | null>;
  health: string | null;
  id: Generated<number | null>;
  intelligence: Generated<number | null>;
  level: string | null;
  location: string | null;
  mana: string | null;
  material: Generated<number | null>;
  name: string | null;
  online: Generated<number | null>;
  points: Generated<number | null>;
  race: string | null;
  rot: Generated<number | null>;
  strength: Generated<number | null>;
  user_id: number | null;
  wisdom: Generated<number | null>;
  x: Generated<number | null>;
  y: Generated<number | null>;
  z: Generated<number | null>;
}

export interface Users {
  id: Generated<number | null>;
  password: string | null;
  token: string | null;
  username: string;
}

export interface DB {
  character_abilities: CharacterAbilities;
  character_equipment: CharacterEquipment;
  character_inventory: CharacterInventory;
  character_quests: CharacterQuests;
  characters: Characters;
  users: Users;
}
