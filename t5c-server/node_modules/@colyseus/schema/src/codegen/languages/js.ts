import { Class, Property, File, getCommentHeader, getInheritanceTree, Context } from "../types";
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
    return context.classes.map(klass => ({
        name: klass.name + ".js",
        content: generateClass(klass, options.namespace, context.classes)
    }));
}

function generateClass(klass: Class, namespace: string, allClasses: Class[]) {
    const allRefs: Property[] = [];
    klass.properties.forEach(property => {
        let type = property.type;

        // keep all refs list
        if ((type === "ref" || type === "array" || type === "map")) {
            allRefs.push(property);
        }
    });

    return `${getCommentHeader()}

const schema = require("@colyseus/schema");
const Schema = schema.Schema;
const type = schema.type;
${allRefs.
    filter(ref => ref.childType && typeMaps[ref.childType] === undefined).
    map(ref => ref.childType).
    concat(getInheritanceTree(klass, allClasses, false).map(klass => klass.name)).
    filter(distinct).
    map(childType => `const ${childType} = require("./${childType}");`).
    join("\n")}

class ${klass.name} extends ${klass.extends} {
    constructor () {
        super();
${klass.properties.
    filter(prop => prop.childType !== undefined).
    map(prop => "        " + generatePropertyInitializer(prop)).join("\n")}
    }
}
${klass.properties.map(prop => generatePropertyDeclaration(klass.name, prop)).join("\n")}

export default ${klass.name};
`;
}

function generatePropertyDeclaration(className: string, prop: Property) {
    let typeArgs: string;

    if (prop.childType) {
        const isUpcaseFirst = prop.childType.match(/^[A-Z]/);

        if (isUpcaseFirst) {
            typeArgs += `, ${prop.childType}`;

        } else {
            typeArgs += `, "${prop.childType}"`;
        }

        if(prop.type === "ref") {
            typeArgs = `${prop.childType}`;

        } else if(prop.type === "array") {
            typeArgs = (isUpcaseFirst)
                ? `[ ${prop.childType} ]`
                : `[ "${prop.childType}" ]`;

        } else if(prop.type === "map") {
            typeArgs = (isUpcaseFirst)
                ? `{ map: ${prop.childType} }`
                : `{ map: "${prop.childType}" }`;
        }

    } else {
        typeArgs = `"${prop.type}"`;
    }

    return `type(${typeArgs})(${className}.prototype, "${prop.name}");`;
}

function generatePropertyInitializer(prop: Property) {
    let initializer = "";

    if(prop.type === "ref") {
        initializer = `new ${prop.childType}()`;

    } else if(prop.type === "array") {
        initializer = `new schema.ArraySchema()`;

    } else if(prop.type === "map") {
        initializer = `new schema.MapSchema()`;
    }

    return `this.${prop.name} = ${initializer}`;
}
