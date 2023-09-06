export declare function getCommentHeader(singleLineComment?: string): string;
export declare class Context {
    classes: Class[];
    interfaces: Interface[];
    enums: Enum[];
    getStructures(): {
        classes: Class[];
        interfaces: Interface[];
        enums: Enum[];
    };
    addStructure(structure: IStructure): void;
    private getParentClass;
    private isSchemaClass;
}
export interface IStructure {
    context: Context;
    name: string;
    properties: Property[];
    addProperty(property: Property): any;
}
export declare class Interface implements IStructure {
    context: Context;
    name: string;
    properties: Property[];
    addProperty(property: Property): void;
}
export declare class Class implements IStructure {
    context: Context;
    name: string;
    properties: Property[];
    extends: string;
    addProperty(property: Property): void;
    postProcessing(): void;
}
export declare class Enum implements IStructure {
    context: Context;
    name: string;
    properties: Property[];
    addProperty(property: Property): void;
}
export declare class Property {
    index: number;
    name: string;
    type: string;
    childType: string;
    deprecated?: boolean;
}
export interface File {
    name: string;
    content: string;
}
export declare function getInheritanceTree(klass: Class, allClasses: Class[], includeSelf?: boolean): Class[];
