"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaSerializer = void 0;
const schema_1 = require("@colyseus/schema");
class SchemaSerializer {
    setState(rawState) {
        return this.state.decode(rawState);
    }
    getState() {
        return this.state;
    }
    patch(patches) {
        return this.state.decode(patches);
    }
    teardown() {
        var _a, _b;
        (_b = (_a = this.state) === null || _a === void 0 ? void 0 : _a['$changes']) === null || _b === void 0 ? void 0 : _b.root.clearRefs();
    }
    handshake(bytes, it) {
        if (this.state) {
            // TODO: validate client/server definitinos
            const reflection = new schema_1.Reflection();
            reflection.decode(bytes, it);
        }
        else {
            // initialize reflected state from server
            this.state = schema_1.Reflection.decode(bytes, it);
        }
    }
}
exports.SchemaSerializer = SchemaSerializer;
//# sourceMappingURL=SchemaSerializer.js.map