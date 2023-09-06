"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaSerializer = exports.registerSerializer = exports.Platform = exports.Auth = exports.Room = exports.ErrorCode = exports.Protocol = exports.Client = void 0;
require("./legacy");
var Client_1 = require("./Client");
Object.defineProperty(exports, "Client", { enumerable: true, get: function () { return Client_1.Client; } });
var Protocol_1 = require("./Protocol");
Object.defineProperty(exports, "Protocol", { enumerable: true, get: function () { return Protocol_1.Protocol; } });
Object.defineProperty(exports, "ErrorCode", { enumerable: true, get: function () { return Protocol_1.ErrorCode; } });
var Room_1 = require("./Room");
Object.defineProperty(exports, "Room", { enumerable: true, get: function () { return Room_1.Room; } });
var Auth_1 = require("./Auth");
Object.defineProperty(exports, "Auth", { enumerable: true, get: function () { return Auth_1.Auth; } });
Object.defineProperty(exports, "Platform", { enumerable: true, get: function () { return Auth_1.Platform; } });
/*
 * Serializers
 */
const SchemaSerializer_1 = require("./serializer/SchemaSerializer");
Object.defineProperty(exports, "SchemaSerializer", { enumerable: true, get: function () { return SchemaSerializer_1.SchemaSerializer; } });
const NoneSerializer_1 = require("./serializer/NoneSerializer");
const Serializer_1 = require("./serializer/Serializer");
Object.defineProperty(exports, "registerSerializer", { enumerable: true, get: function () { return Serializer_1.registerSerializer; } });
(0, Serializer_1.registerSerializer)('schema', SchemaSerializer_1.SchemaSerializer);
(0, Serializer_1.registerSerializer)('none', NoneSerializer_1.NoneSerializer);
//# sourceMappingURL=index.js.map