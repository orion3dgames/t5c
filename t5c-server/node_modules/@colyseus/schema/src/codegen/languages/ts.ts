import { Class, Property, File, getCommentHeader, getInheritanceTree, Context, Interface } from "../types";
import { GenerateOptions } from "../api";

const typeMaps = {
    "string": "string",
    "number": "number",
    "boolean": "boolean",
    "int8": "number",
    "uint8": "number",
    "int16": "number",
    "uint16": "number",
    "int32": "number",
    "uint32": "number",
    "int64": "number",
    "uint64": "number",
    "float32": "number",
    "float64": "number",
}

const distinct = (value, index, self) => self.indexOf(value) === index;

export function generate (context: Context, options: GenerateOptions): File[] {
    return [
        ...context.classes.map(structure => ({
            name: structure.name + ".ts",
            content: generateClass(structure, options.namespace, context.classes)
        })),
        ...context.interfaces.map(structure => ({
            name: structure.name + ".ts",
            content: generateInterface(structure, options.namespace, context.classes),
        }))
    ];
}

function generateClass(klass: Class, namespace: string, allClasses: Class[]) {
    const allRefs: Property[] = [];
    klass.properties.forEach(property => {
        let type = property.type;

        // keep all refs list
        if ((type === "ref" || type === "array" || type === "map" || type === "set")) {
            allRefs.push(property);
        }
    });

    return `${getCommentHeader()}

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';
${allRefs.
    filter(ref => ref.childType && typeMaps[ref.childType] === undefined).
    map(ref => ref.childType).
    concat(getInheritanceTree(klass, allClasses, false).map(klass => klass.name)).
    filter(distinct).
    map(childType => `import { ${childType} } from './${childType}'`).
    join("\n")}

export class ${klass.name} extends ${klass.extends} {
${klass.properties.map(prop => `    ${generateProperty(prop)}`).join("\n")}
}
`;
}

function generateProperty(prop: Property) {
    let langType: string;
    let initializer = "";
    let typeArgs: string;

    if (prop.childType) {
        const isUpcaseFirst = prop.childType.match(/^[A-Z]/);

        if (isUpcaseFirst) {
            typeArgs += `, ${prop.childType}`;

        } else {
            typeArgs += `, "${prop.childType}"`;
        }

        if(prop.type === "ref") {
            langType = `${prop.childType}`;
            initializer = `new ${prop.childType}()`;
            typeArgs = `${prop.childType}`;

        } else if(prop.type === "array") {
            langType = (isUpcaseFirst)
                ? `ArraySchema<${prop.childType}>`
                : `ArraySchema<${typeMaps[prop.childType]}>`;
            initializer = `new ${langType}()`;
            typeArgs = (isUpcaseFirst)
                ? `[ ${prop.childType} ]`
                : `[ "${prop.childType}" ]`;

        } else if(prop.type === "map") {
            langType = (isUpcaseFirst)
                ? `MapSchema<${prop.childType}>`
                : `MapSchema<${typeMaps[prop.childType]}>`;
            initializer = `new ${langType}()`;
            typeArgs = (isUpcaseFirst)
                ? `{ map: ${prop.childType} }`
                : `{ map: "${prop.childType}" }`;
        } else if (prop.type === "set") {
            langType = (isUpcaseFirst)
                ? `SetSchema<${prop.childType}>`
                : `SetSchema<${typeMaps[prop.childType]}>`;
            initializer = `new ${langType}()`;
            typeArgs = (isUpcaseFirst)
                ? `{ set: ${prop.childType} }`
                : `{ set: "${prop.childType}" }`;
        }

    } else {
        langType = typeMaps[prop.type];
        typeArgs = `"${prop.type}"`;
    }

    // TS1263: "Declarations with initializers cannot also have definite assignment assertions"
    const definiteAssertion = initializer ? "" : "!";

    return `@type(${typeArgs}) public ${prop.name}${definiteAssertion}: ${langType}${(initializer) ? ` = ${initializer}` : ""};`
}


function generateInterface(structure: Interface, namespace: string, allClasses: Class[]) {
    return `${getCommentHeader()}

export interface ${structure.name} {
${structure.properties.map(prop => `    ${prop.name}: ${prop.type};`).join("\n")}
}
`;
}
