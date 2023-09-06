import { ChangeTree } from './changes/ChangeTree';
import { Schema } from './Schema';
import { ArraySchema, getArrayProxy } from './types/ArraySchema';
import { MapSchema, getMapProxy } from './types/MapSchema';
import { getType } from './types/typeRegistry';

/**
 * Data types
 */
export type PrimitiveType =
    "string" |
    "number" |
    "boolean" |
    "int8" |
    "uint8" |
    "int16" |
    "uint16" |
    "int32" |
    "uint32" |
    "int64" |
    "uint64" |
    "float32" |
    "float64" |
    typeof Schema;

export type DefinitionType = PrimitiveType
    | PrimitiveType[]
    | { array: PrimitiveType }
    | { map: PrimitiveType }
    | { collection: PrimitiveType }
    | { set: PrimitiveType };

export type Definition = { [field: string]: DefinitionType };
export type FilterCallback<
    T extends Schema = any,
    V = any,
    R extends Schema = any
> = (
    ((this: T, client: ClientWithSessionId, value: V) => boolean) |
    ((this: T, client: ClientWithSessionId, value: V, root: R) => boolean)
);

export type FilterChildrenCallback<
    T extends Schema = any,
    K = any,
    V = any,
    R extends Schema = any
> = (
    ((this: T, client: ClientWithSessionId, key: K, value: V) => boolean) |
    ((this: T, client: ClientWithSessionId, key: K, value: V, root: R) => boolean)
)

export class SchemaDefinition {
    schema: Definition;

    //
    // TODO: use a "field" structure combining all these properties per-field.
    //

    indexes: { [field: string]: number } = {};
    fieldsByIndex: { [index: number]: string } = {};

    filters: { [field: string]: FilterCallback };
    indexesWithFilters: number[];
    childFilters: { [field: string]: FilterChildrenCallback }; // childFilters are used on Map, Array, Set items.

    deprecated: { [field: string]: boolean } = {};
    descriptors: PropertyDescriptorMap & ThisType<any> = {};

    static create(parent?: SchemaDefinition) {
        const definition = new SchemaDefinition();

        // support inheritance
        definition.schema = Object.assign({}, parent && parent.schema || {});
        definition.indexes = Object.assign({}, parent && parent.indexes || {});
        definition.fieldsByIndex = Object.assign({}, parent && parent.fieldsByIndex || {});
        definition.descriptors = Object.assign({}, parent && parent.descriptors || {});
        definition.deprecated = Object.assign({}, parent && parent.deprecated || {});

        return definition;
    }

    addField(field: string, type: DefinitionType) {
        const index = this.getNextFieldIndex();
        this.fieldsByIndex[index] = field;
        this.indexes[field] = index;
        this.schema[field] = (Array.isArray(type))
            ? { array: type[0] }
            : type;
    }

    hasField(field: string) {
        return this.indexes[field] !== undefined;
    }

    addFilter(field: string, cb: FilterCallback) {
        if (!this.filters) {
            this.filters = {};
            this.indexesWithFilters = [];
        }
        this.filters[this.indexes[field]] = cb;
        this.indexesWithFilters.push(this.indexes[field]);
        return true;
    }

    addChildrenFilter(field: string, cb: FilterChildrenCallback) {
        const index = this.indexes[field];
        const type = this.schema[field];

        if (getType(Object.keys(type)[0])) {
            if (!this.childFilters) { this.childFilters = {}; }

            this.childFilters[index] = cb;
            return true;

        } else {
            console.warn(`@filterChildren: field '${field}' can't have children. Ignoring filter.`);
        }
    }

    getChildrenFilter(field: string) {
        return this.childFilters && this.childFilters[this.indexes[field]];
    }

    getNextFieldIndex() {
        return Object.keys(this.schema || {}).length;
    }
}

export function hasFilter(klass: typeof Schema) {
    return klass._context && klass._context.useFilters;
}

// Colyseus integration
export type ClientWithSessionId = { sessionId: string } & any;

export interface TypeOptions {
    manual?: boolean,
    context?: Context,
}

export class Context {
    types: {[id: number]: typeof Schema} = {};
    schemas = new Map<typeof Schema, number>();
    useFilters = false;

    has(schema: typeof Schema) {
        return this.schemas.has(schema);
    }

    get(typeid: number) {
        return this.types[typeid];
    }

    add(schema: typeof Schema, typeid: number = this.schemas.size) {
        // FIXME: move this to somewhere else?
        // support inheritance
        schema._definition = SchemaDefinition.create(schema._definition);

        schema._typeid = typeid;
        this.types[typeid] = schema;
        this.schemas.set(schema, typeid);
    }


    static create(options: TypeOptions = {}) {
        return function (definition: DefinitionType) {
            if (!options.context) {
                options.context = new Context();
            }
            return type(definition, options);
        }
    }
}

export const globalContext = new Context();

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
export function type (
    type: DefinitionType,
    options: TypeOptions = {}
): PropertyDecorator {
    return function (target: typeof Schema, field: string) {
        const context = options.context || globalContext;
        const constructor = target.constructor as typeof Schema;
        constructor._context = context;

        if (!type) {
            throw new Error(`${constructor.name}: @type() reference provided for "${field}" is undefined. Make sure you don't have any circular dependencies.`);
        }

        /*
         * static schema
         */
        if (!context.has(constructor)) {
            context.add(constructor);
        }

        const definition = constructor._definition;
        definition.addField(field, type);

        /**
         * skip if descriptor already exists for this field (`@deprecated()`)
         */
        if (definition.descriptors[field]) {
            if (definition.deprecated[field]) {
                // do not create accessors for deprecated properties.
                return;

            } else {
                // trying to define same property multiple times across inheritance.
                // https://github.com/colyseus/colyseus-unity3d/issues/131#issuecomment-814308572
                try {
                    throw new Error(`@colyseus/schema: Duplicate '${field}' definition on '${constructor.name}'.\nCheck @type() annotation`);

                } catch (e) {
                    const definitionAtLine = e.stack.split("\n")[4].trim();
                    throw new Error(`${e.message} ${definitionAtLine}`);
                }
            }
        }

        const isArray = ArraySchema.is(type);
        const isMap = !isArray && MapSchema.is(type);

        // TODO: refactor me.
        // Allow abstract intermediary classes with no fields to be serialized
        // (See "should support an inheritance with a Schema type without fields" test)
        if (typeof (type) !== "string" && !Schema.is(type)) {
            const childType = Object.values(type)[0];
            if (typeof (childType) !== "string" && !context.has(childType)) {
                context.add(childType);
            }
        }

        if (options.manual) {
            // do not declare getter/setter descriptor
            definition.descriptors[field] = {
                enumerable: true,
                configurable: true,
                writable: true,
            };
            return;
        }

        const fieldCached = `_${field}`;
        definition.descriptors[fieldCached] = {
            enumerable: false,
            configurable: false,
            writable: true,
        };

        definition.descriptors[field] = {
            get: function () {
                return this[fieldCached];
            },

            set: function (this: Schema, value: any) {
                /**
                 * Create Proxy for array or map items
                 */

                // skip if value is the same as cached.
                if (value === this[fieldCached]) {
                    return;
                }

                if (
                    value !== undefined &&
                    value !== null
                ) {
                    // automaticallty transform Array into ArraySchema
                    if (isArray && !(value instanceof ArraySchema)) {
                        value = new ArraySchema(...value);
                    }

                    // automaticallty transform Map into MapSchema
                    if (isMap && !(value instanceof MapSchema)) {
                        value = new MapSchema(value);
                    }

                    // try to turn provided structure into a Proxy
                    if (value['$proxy'] === undefined) {
                        if (isMap) {
                            value = getMapProxy(value);

                        } else if (isArray) {
                            value = getArrayProxy(value);
                        }
                    }

                    // flag the change for encoding.
                    this.$changes.change(field);

                    //
                    // call setParent() recursively for this and its child
                    // structures.
                    //
                    if (value['$changes']) {
                        (value['$changes'] as ChangeTree).setParent(
                            this,
                            this.$changes.root,
                            this._definition.indexes[field],
                        );
                    }

                } else if (this[fieldCached]) {
                    //
                    // Setting a field to `null` or `undefined` will delete it.
                    //
                    this.$changes.delete(field);
                }

                this[fieldCached] = value;
            },

            enumerable: true,
            configurable: true
        };
    }
}

/**
 * `@filter()` decorator for defining data filters per client
 */

export function filter<T extends Schema, V, R extends Schema>(cb: FilterCallback<T, V, R>): PropertyDecorator {
    return function (target: any, field: string) {
        const constructor = target.constructor as typeof Schema;
        const definition = constructor._definition;

        if (definition.addFilter(field, cb)) {
            constructor._context.useFilters = true;
        }
    }
}

export function filterChildren<T extends Schema, K, V, R extends Schema>(cb: FilterChildrenCallback<T, K, V, R>): PropertyDecorator {
    return function (target: any, field: string) {
        const constructor = target.constructor as typeof Schema;
        const definition = constructor._definition;
        if (definition.addChildrenFilter(field, cb)) {
            constructor._context.useFilters = true;
        }
    }
}


/**
 * `@deprecated()` flag a field as deprecated.
 * The previous `@type()` annotation should remain along with this one.
 */

export function deprecated(throws: boolean = true): PropertyDecorator {
    return function (target: typeof Schema, field: string) {
        const constructor = target.constructor as typeof Schema;
        const definition = constructor._definition;

        definition.deprecated[field] = true;

        if (throws) {
            definition.descriptors[field] = {
                get: function () { throw new Error(`${field} is deprecated.`); },
                set: function (this: Schema, value: any) { /* throw new Error(`${field} is deprecated.`); */ },
                enumerable: false,
                configurable: true
            };
        }
    }
}

export function defineTypes(
    target: typeof Schema,
    fields: { [property: string]: DefinitionType },
    options: TypeOptions = {}
) {
    if (!options.context) {
        options.context = target._context || options.context || globalContext;
    }

    for (let field in fields) {
        type(fields[field], options)(target.prototype, field);
    }
    return target;
}
