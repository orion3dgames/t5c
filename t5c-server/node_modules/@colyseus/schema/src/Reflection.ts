import { type, PrimitiveType, Context, DefinitionType } from "./annotations";
import { Schema } from "./Schema";
import { ArraySchema } from "./types/ArraySchema";
import { getType } from "./types/typeRegistry";
import { Iterator } from "./encoding/decode";

const reflectionContext = { context: new Context() };

/**
 * Reflection
 */
export class ReflectionField extends Schema {
    @type("string", reflectionContext)
    name: string;

    @type("string", reflectionContext)
    type: string;

    @type("number", reflectionContext)
    referencedType: number;
}

export class ReflectionType extends Schema {
    @type("number", reflectionContext)
    id: number;

    @type([ ReflectionField ], reflectionContext)
    fields: ArraySchema<ReflectionField> = new ArraySchema<ReflectionField>();
}

export class Reflection extends Schema {
    @type([ ReflectionType ], reflectionContext)
    types: ArraySchema<ReflectionType> = new ArraySchema<ReflectionType>();

    @type("number", reflectionContext)
    rootType: number;

    static encode (instance: Schema) {
        const rootSchemaType = instance.constructor as typeof Schema;

        const reflection = new Reflection();
        reflection.rootType = rootSchemaType._typeid;

        const buildType = (currentType: ReflectionType, schema: any) => {
            for (let fieldName in schema) {
                const field = new ReflectionField();
                field.name = fieldName;

                let fieldType: string;

                if (typeof (schema[fieldName]) === "string") {
                    fieldType = schema[fieldName];

                } else {
                    const type = schema[fieldName];
                    let childTypeSchema: typeof Schema;

                    //
                    // TODO: refactor below.
                    //
                    if (Schema.is(type)) {
                        fieldType = "ref";
                        childTypeSchema = schema[fieldName];

                    } else {
                        fieldType = Object.keys(type)[0];

                        if (typeof(type[fieldType]) === "string") {
                            fieldType += ":" + type[fieldType]; // array:string

                        } else {
                            childTypeSchema = type[fieldType];
                        }
                    }

                    field.referencedType = (childTypeSchema)
                        ? childTypeSchema._typeid
                        : -1;
                }

                field.type = fieldType;
                currentType.fields.push(field);
            }

            reflection.types.push(currentType);
        }

        const types = rootSchemaType._context.types;
        for (let typeid in types) {
            const type = new ReflectionType();
            type.id = Number(typeid);
            buildType(type, types[typeid]._definition.schema);
        }

        return reflection.encodeAll();
    }

    static decode<T extends Schema = Schema>(bytes: number[], it?: Iterator): T {
        const context = new Context();

        const reflection = new Reflection();
        reflection.decode(bytes, it);

        const schemaTypes = reflection.types.reduce((types, reflectionType) => {
            const schema: typeof Schema = class _ extends Schema {};
            const typeid = reflectionType.id;
            types[typeid] = schema
            context.add(schema, typeid);
            return types;
        }, {});

        reflection.types.forEach((reflectionType) => {
            const schemaType = schemaTypes[reflectionType.id];

            reflectionType.fields.forEach(field => {
                if (field.referencedType !== undefined) {
                    let fieldType = field.type;
                    let refType = schemaTypes[field.referencedType];

                    // map or array of primitive type (-1)
                    if (!refType) {
                        const typeInfo = field.type.split(":");
                        fieldType = typeInfo[0];
                        refType = typeInfo[1];
                    }

                    if (fieldType === "ref") {
                        type(refType, { context })(schemaType.prototype, field.name);

                    } else {
                        type({ [fieldType]: refType } as DefinitionType, { context })(schemaType.prototype, field.name);
                    }

                } else {
                    type(field.type as PrimitiveType, { context })(schemaType.prototype, field.name);
                }
            });
        })

        const rootType: any = schemaTypes[reflection.rootType];
        const rootInstance = new rootType();

        /**
         * auto-initialize referenced types on root type
         * to allow registering listeners immediatelly on client-side
         */
        for (let fieldName in rootType._definition.schema) {
            const fieldType = rootType._definition.schema[fieldName];

            if (typeof(fieldType) !== "string") {
                rootInstance[fieldName] = (typeof (fieldType) === "function")
                    ? new (fieldType as any)() // is a schema reference
                    : new (getType(Object.keys(fieldType)[0])).constructor(); // is a "collection"
            }
        }

        return rootInstance;
    }
}