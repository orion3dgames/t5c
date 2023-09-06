import { ArraySchema } from "./ArraySchema";
import { MapSchema } from "./MapSchema";

export type NonFunctionProps<T> = Omit<T, {
    [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T]>;

export type NonFunctionPropNames<T> = {
    [K in keyof T]: T[K] extends Function ? never : K
}[keyof T];

export type ToJSON<T> = Partial<NonFunctionProps<{
    [K in keyof T]: T[K] extends MapSchema<infer U>
        ? Record<string, U>
        : T[K] extends ArraySchema<infer U>
            ? U[]
            : T[K]
}>>;