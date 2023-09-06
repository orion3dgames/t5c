export interface TypeDefinition {
    constructor: any;
}
export declare function registerType(identifier: string, definition: TypeDefinition): void;
export declare function getType(identifier: string): TypeDefinition;
