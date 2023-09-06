import * as fs from "fs";

const VERSION = JSON.parse(fs.readFileSync(__dirname + "/../../package.json").toString()).version;
const COMMENT_HEADER = `
THIS FILE HAS BEEN GENERATED AUTOMATICALLY
DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING

GENERATED USING @colyseus/schema ${VERSION}
`;

export function getCommentHeader(singleLineComment: string = "//") {
    return `${COMMENT_HEADER.split("\n").map(line => `${singleLineComment} ${line}`).join("\n")}`;
}

export class Context {
    classes: Class[] = [];
    interfaces: Interface[] = [];
    enums: Enum[] = [];

    getStructures() {
        return {
            classes: this.classes.filter(klass => {
                if (this.isSchemaClass(klass)) {
                    return true;

                } else {
                    let parentClass = klass;
                    while (parentClass = this.getParentClass(parentClass)) {
                        if (this.isSchemaClass(parentClass)) {
                            return true;
                        }
                    }
                }
                return false;
            }),
            interfaces: this.interfaces,
            enums: this.enums,
        };
    }

    addStructure(structure: IStructure) {
        structure.context = this;

        if (structure instanceof Class) {
            this.classes.push(structure);
        } else if (structure instanceof Interface) {
            this.interfaces.push(structure);
        } else if (structure instanceof Enum) {
            this.enums.push(structure);
        }
    }

    private getParentClass(klass: Class) {
        return this.classes.find(c => c.name === klass.extends);
    }

    private isSchemaClass(klass: Class) {
        let isSchema: boolean = false;

        let currentClass = klass;
        while (!isSchema && currentClass) {
            //
            // TODO: ideally we should check for actual @colyseus/schema module
            // reference rather than arbitrary strings.
            //
            isSchema = (
                currentClass.extends === "Schema" ||
                currentClass.extends === "schema.Schema" ||
                currentClass.extends === "Schema.Schema"
            );

            //
            // When extending from `schema.Schema`, it is required to
            // normalize as "Schema" for code generation.
            //
            if (currentClass === klass && isSchema) {
                klass.extends = "Schema";
            }

            currentClass = this.getParentClass(currentClass);
        }

        return isSchema;
    }
}

export interface IStructure {
    context: Context;
    name: string;
    properties: Property[];
    addProperty(property: Property);
}

export class Interface implements IStructure {
    context: Context;
    name: string;
    properties: Property[] = [];

    addProperty(property: Property) {
        if (property.type.indexOf("[]") >= 0) {
            // is array!
            property.childType = property.type.match(/([^\[]+)/i)[1];
            property.type = "array";
            this.properties.push(property);

        } else {
            this.properties.push(property);
        }
    }
}

export class Class implements IStructure {
    context: Context;
    name: string;
    properties: Property[] = [];
    extends: string;

    addProperty(property: Property) {
        property.index = this.properties.length;
        this.properties.push(property);
    }

    postProcessing() {
        /**
         * Ensure the proprierties `index` are correct using inheritance
         */
        let parentKlass: Class = this;

        while (
            parentKlass &&
            (parentKlass = this.context.classes.find(k => k.name === parentKlass.extends))
        ) {
            this.properties.forEach(prop => {
                prop.index += parentKlass.properties.length;
            });
        }
    }
}

export class Enum implements IStructure {
    context: Context;
    name: string;
    properties: Property[] = [];

    addProperty(property: Property) {
        this.properties.push(property);
    }
}

export class Property {
    index: number;
    name: string;
    type: string;
    childType: string;
    deprecated?: boolean;
}

export interface File {
    name: string
    content: string;
}

export function getInheritanceTree(klass: Class, allClasses: Class[], includeSelf: boolean = true) {
    let currentClass = klass;
    let inheritanceTree: Class[] = [];

    if (includeSelf) {
        inheritanceTree.push(currentClass);
    }

    while (currentClass.extends !== "Schema") {
        currentClass = allClasses.find(klass => klass.name == currentClass.extends);
        inheritanceTree.push(currentClass);
    }

    return inheritanceTree;
}
