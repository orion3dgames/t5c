"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getType = exports.registerType = void 0;
const registeredTypes = {};
function registerType(identifier, definition) {
    registeredTypes[identifier] = definition;
}
exports.registerType = registerType;
function getType(identifier) {
    return registeredTypes[identifier];
}
exports.getType = getType;
//# sourceMappingURL=typeRegistry.js.map