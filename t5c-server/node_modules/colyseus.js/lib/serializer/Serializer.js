"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSerializer = exports.registerSerializer = void 0;
const serializers = {};
function registerSerializer(id, serializer) {
    serializers[id] = serializer;
}
exports.registerSerializer = registerSerializer;
function getSerializer(id) {
    const serializer = serializers[id];
    if (!serializer) {
        throw new Error("missing serializer: " + id);
    }
    return serializer;
}
exports.getSerializer = getSerializer;
//# sourceMappingURL=Serializer.js.map