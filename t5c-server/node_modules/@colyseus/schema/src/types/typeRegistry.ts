export interface TypeDefinition {
    constructor: any,

    // //
    // // TODO: deprecate proxy on next version
    // // the proxy is used for compatibility with versions <1.0.0 of @colyseus/schema
    // //
    // getProxy?: any,
}

const registeredTypes: {[identifier: string] : TypeDefinition} = {};

export function registerType(identifier: string, definition: TypeDefinition) {
    registeredTypes[identifier] = definition;
}

export function getType(identifier: string): TypeDefinition {
    return registeredTypes[identifier];
}
