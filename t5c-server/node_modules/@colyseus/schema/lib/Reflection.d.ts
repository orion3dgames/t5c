import { Schema } from "./Schema";
import { ArraySchema } from "./types/ArraySchema";
import { Iterator } from "./encoding/decode";
/**
 * Reflection
 */
export declare class ReflectionField extends Schema {
    name: string;
    type: string;
    referencedType: number;
}
export declare class ReflectionType extends Schema {
    id: number;
    fields: ArraySchema<ReflectionField>;
}
export declare class Reflection extends Schema {
    types: ArraySchema<ReflectionType>;
    rootType: number;
    static encode(instance: Schema): number[];
    static decode<T extends Schema = Schema>(bytes: number[], it?: Iterator): T;
}
