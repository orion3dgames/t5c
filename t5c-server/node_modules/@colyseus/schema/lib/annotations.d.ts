import { Schema } from './Schema';
/**
 * Data types
 */
export type PrimitiveType = "string" | "number" | "boolean" | "int8" | "uint8" | "int16" | "uint16" | "int32" | "uint32" | "int64" | "uint64" | "float32" | "float64" | typeof Schema;
export type DefinitionType = PrimitiveType | PrimitiveType[] | {
    array: PrimitiveType;
} | {
    map: PrimitiveType;
} | {
    collection: PrimitiveType;
} | {
    set: PrimitiveType;
};
export type Definition = {
    [field: string]: DefinitionType;
};
export type FilterCallback<T extends Schema = any, V = any, R extends Schema = any> = (((this: T, client: ClientWithSessionId, value: V) => boolean) | ((this: T, client: ClientWithSessionId, value: V, root: R) => boolean));
export type FilterChildrenCallback<T extends Schema = any, K = any, V = any, R extends Schema = any> = (((this: T, client: ClientWithSessionId, key: K, value: V) => boolean) | ((this: T, client: ClientWithSessionId, key: K, value: V, root: R) => boolean));
export declare class SchemaDefinition {
    schema: Definition;
    indexes: {
        [field: string]: number;
    };
    fieldsByIndex: {
        [index: number]: string;
    };
    filters: {
        [field: string]: FilterCallback;
    };
    indexesWithFilters: number[];
    childFilters: {
        [field: string]: FilterChildrenCallback;
    };
    deprecated: {
        [field: string]: boolean;
    };
    descriptors: PropertyDescriptorMap & ThisType<any>;
    static create(parent?: SchemaDefinition): SchemaDefinition;
    addField(field: string, type: DefinitionType): void;
    hasField(field: string): boolean;
    addFilter(field: string, cb: FilterCallback): boolean;
    addChildrenFilter(field: string, cb: FilterChildrenCallback): boolean;
    getChildrenFilter(field: string): FilterChildrenCallback<any, any, any, any>;
    getNextFieldIndex(): number;
}
export declare function hasFilter(klass: typeof Schema): boolean;
export type ClientWithSessionId = {
    sessionId: string;
} & any;
export interface TypeOptions {
    manual?: boolean;
    context?: Context;
}
export declare class Context {
    types: {
        [id: number]: typeof Schema;
    };
    schemas: Map<typeof Schema, number>;
    useFilters: boolean;
    has(schema: typeof Schema): boolean;
    get(typeid: number): typeof Schema;
    add(schema: typeof Schema, typeid?: number): void;
    static create(options?: TypeOptions): (definition: DefinitionType) => PropertyDecorator;
}
export declare const globalContext: Context;
/**
 * [See documentation](https://docs.colyseus.io/state/schema/)
 *
 * Annotate a Schema property to be serializeable.
 * \@type()'d fields are automatically flagged as "dirty" for the next patch.
 *
 * @example Standard usage, with automatic change tracking.
 * ```
 * \@type("string") propertyName: string;
 * ```
 *
 * @example You can provide the "manual" option if you'd like to manually control your patches via .setDirty().
 * ```
 * \@type("string", { manual: true })
 * ```
 */
export declare function type(type: DefinitionType, options?: TypeOptions): PropertyDecorator;
/**
 * `@filter()` decorator for defining data filters per client
 */
export declare function filter<T extends Schema, V, R extends Schema>(cb: FilterCallback<T, V, R>): PropertyDecorator;
export declare function filterChildren<T extends Schema, K, V, R extends Schema>(cb: FilterChildrenCallback<T, K, V, R>): PropertyDecorator;
/**
 * `@deprecated()` flag a field as deprecated.
 * The previous `@type()` annotation should remain along with this one.
 */
export declare function deprecated(throws?: boolean): PropertyDecorator;
export declare function defineTypes(target: typeof Schema, fields: {
    [property: string]: DefinitionType;
}, options?: TypeOptions): typeof Schema;
