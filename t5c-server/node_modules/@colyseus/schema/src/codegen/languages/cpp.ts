import { Class, Property, File, getCommentHeader, getInheritanceTree, Context } from "../types";
import { GenerateOptions } from "../api";

const typeMaps = {
    "string": "string",
    "number": "varint_t",
    "boolean": "bool",
    "int8": "int8_t",
    "uint8": "uint8_t",
    "int16": "int16_t",
    "uint16": "uint16_t",
    "int32": "int32_t",
    "uint32": "uint32_t",
    "int64": "int64_t",
    "uint64": "uint64_t",
    "float32": "float32_t",
    "float64": "float64_t",
}

const typeInitializer = {
    "string": '""',
    "number": "0",
    "boolean": "false",
    "int8": "0",
    "uint8": "0",
    "int16": "0",
    "uint16": "0",
    "int32": "0",
    "uint32": "0",
    "int64": "0",
    "uint64": "0",
    "float32": "0",
    "float64": "0",
}

/**
 * C++ Code Generator
 */

const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1);
}
const distinct = (value, index, self) => self.indexOf(value) === index;

export function generate (context: Context, options: GenerateOptions): File[] {
    return context.classes.map(klass => ({
        name: klass.name + ".hpp",
        content: generateClass(klass, options.namespace, context.classes)
    }));
}

function generateClass(klass: Class, namespace: string, allClasses: Class[]) {
    const propertiesPerType: {[type: string]: Property[]} = {};
    const allRefs: Property[] = [];
    klass.properties.forEach(property => {
        let type = property.type;

        if (!propertiesPerType[type]) {
            propertiesPerType[type] = [];
        }

        propertiesPerType[type].push(property);

        // keep all refs list
        if ((type === "ref" || type === "array" || type === "map")) {
            allRefs.push(property);
        }
    });

    const allProperties = getAllProperties(klass, allClasses);
    const createInstanceMethod = (allRefs.length === 0) ? "" :
    `\tinline Schema* createInstance(std::type_index type) {
\t\t${generateFieldIfElseChain(allRefs,
    (property) => `type == typeid(${property.childType})`,
    (property) => `return new ${property.childType}();`,
    (property) => typeMaps[property.childType] === undefined)}
\t\treturn ${klass.extends}::createInstance(type);
\t}`;

    return `${getCommentHeader()}
#ifndef __SCHEMA_CODEGEN_${klass.name.toUpperCase()}_H__
#define __SCHEMA_CODEGEN_${klass.name.toUpperCase()}_H__ 1

#include "schema.h"
#include <typeinfo>
#include <typeindex>

${allRefs.
    filter(ref => ref.childType && typeMaps[ref.childType] === undefined).
    map(ref => ref.childType).
    concat(getInheritanceTree(klass, allClasses, false).map(klass => klass.name)).
    filter(distinct).
    map(childType => `#include "${childType}.hpp"`).
    join("\n")}

using namespace colyseus::schema;

${namespace ? `namespace ${namespace} {` : ""}
class ${klass.name} : public ${klass.extends} {
public:
${klass.properties.map(prop => generateProperty(prop)).join("\n")}

\t${klass.name}() {
\t\tthis->_indexes = ${generateAllIndexes(allProperties)};
\t\tthis->_types = ${generateAllTypes(allProperties)};
\t\tthis->_childPrimitiveTypes = ${generateAllChildPrimitiveTypes(allProperties)};
\t\tthis->_childSchemaTypes = ${generateAllChildSchemaTypes(allProperties)};
\t}

\tvirtual ~${klass.name}() {
\t\t${generateDestructors(allProperties).join("\n\t\t")}
\t}

protected:
${Object.keys(propertiesPerType).map(type =>
    generateGettersAndSetters(klass, type, propertiesPerType[type])).
    join("\n")}

${createInstanceMethod}
};
${namespace ? "}" : ""}

#endif
`;
}

function generateProperty(prop: Property) {
    let property = "";
    let langType: string;
    let initializer = "";
    let isPropPointer = "";

    if (prop.childType) {
        const isUpcaseFirst = prop.childType.match(/^[A-Z]/);

        if(prop.type === "ref") {
            langType = `${prop.childType}`;
            initializer = `new ${prop.childType}()`;

        } else if(prop.type === "array") {
            langType = (isUpcaseFirst)
                ? `ArraySchema<${prop.childType}*>`
                : `ArraySchema<${typeMaps[prop.childType]}>`;
            initializer = `new ${langType}()`;

        } else if(prop.type === "map") {
            langType = (isUpcaseFirst)
                ? `MapSchema<${prop.childType}*>`
                : `MapSchema<${typeMaps[prop.childType]}>`;
            initializer = `new ${langType}()`;
        }
        isPropPointer = "*";

    } else {
        langType = typeMaps[prop.type];
        initializer = typeInitializer[prop.type];
    }

    property += ` ${langType} ${isPropPointer}${prop.name}`;

    return `\t${property} = ${initializer};`
}

function generateGettersAndSetters(klass: Class, type: string, properties: Property[]) {
    let langType = typeMaps[type];
    let typeCast = "";

    const getMethodName = `get${capitalize(type)}`;
    const setMethodName = `set${capitalize(type)}`;

    if (type === "ref") {
        langType = "Schema*";

    } else if (type === "array") {
        langType = `ArraySchema<char*> *`;
        typeCast = `(ArraySchema<char*> *)`;

    } else if (type === "map") {
        langType = `MapSchema<char*> *`;
        typeCast = `(MapSchema<char*> *)`;
    }

    return `\tinline ${langType} ${getMethodName}(const string &field)
\t{
\t\t${generateFieldIfElseChain(properties,
    (property) => `field == "${property.name}"`,
    (property) => `return ${typeCast}this->${property.name};`)}
\t\treturn ${klass.extends}::${getMethodName}(field);
\t}

\tinline void ${setMethodName}(const string &field, ${langType} value)
\t{
\t\t${generateFieldIfElseChain(properties,
    (property) => `field == "${property.name}"`,
    (property) => {
        const isSchemaType = (typeMaps[property.childType] === undefined)

        if (type === "ref") {
            langType = `${property.childType}*`;
            typeCast = (isSchemaType)
                ? `(${property.childType}*)`
                : `/* bug? */`;

        } else if (type === "array") {
            typeCast = (isSchemaType)
                ? `(ArraySchema<${property.childType}*> *)`
                : `(ArraySchema<${typeMaps[property.childType]}> *)`;

        } else if (type === "map") {
            typeCast = (isSchemaType)
                ? `(MapSchema<${property.childType}*> *)`
                : `(MapSchema<${typeMaps[property.childType]}> *)`;
        }

        return `this->${property.name} = ${typeCast}value;\n\t\t\treturn;`
    })}
\t\treturn ${klass.extends}::${setMethodName}(field, value);
\t}`;
}

function generateFieldIfElseChain(
    properties: Property[],
    ifCallback: (property: Property) => string,
    callback: (property: Property) => string,
    filter: (property: Property) => boolean = (_) => true,
) {
    let chain = "";

    const uniqueChecks: string[] = [];
    properties.filter(filter).forEach((property, i) => {
        const check = ifCallback(property);
        if (uniqueChecks.indexOf(check) === -1) {
            uniqueChecks.push(check);

        } else {
            return;
        }

        if (i === 0) { chain += "if " } else { chain += " else if " }
        chain += `(${check})
\t\t{
\t\t\t${callback(property)}\n
\t\t}`
    });

    return chain;
}

function generateAllIndexes(properties: Property[]) {
    return `{${properties.map((property, i) => `{${i}, "${property.name}"}`).join(", ")}}`

}

function generateAllTypes(properties: Property[]) {
    return `{${properties.map((property, i) => `{${i}, "${property.type}"}`).join(", ")}}`
}

function generateAllChildSchemaTypes(properties: Property[]) {
    return `{${properties.map((property, i) => {
        if (property.childType && typeMaps[property.childType] === undefined) {
            return `{${i}, typeid(${property.childType})}`
        } else {
            return null;
        }
    }).filter(r => r !== null).join(", ")}}`
}

function generateAllChildPrimitiveTypes(properties: Property[]) {
    return `{${properties.map((property, i) => {
        if (typeMaps[property.childType] !== undefined) {
            return `{${i}, "${property.childType}"}`
        } else {
            return null;
        }
    }).filter(r => r !== null).join(", ")}}`
}

function generateDestructors(properties: Property[]) {
    return properties.map((property, i) => {
        if (property.childType) {
            return `delete this->${property.name};`;
        } else {
            return null;
        }
    }).filter(r => r !== null);
}

function getAllProperties (klass: Class, allClasses: Class[]) {
    let properties: Property[] = [];

    getInheritanceTree(klass, allClasses).reverse().forEach((klass) => {
        properties = properties.concat(klass.properties);
    });

    return properties;
}