var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var Debug_exports = {};
__export(Debug_exports, {
  debugAndPrintError: () => debugAndPrintError,
  debugConnection: () => debugConnection,
  debugDriver: () => debugDriver,
  debugError: () => debugError,
  debugMatchMaking: () => debugMatchMaking,
  debugMessage: () => debugMessage,
  debugPatch: () => debugPatch,
  debugPresence: () => debugPresence
});
module.exports = __toCommonJS(Debug_exports);
var import_debug = __toESM(require("debug"));
var import_Logger = require("./Logger");
var import_ServerError = require("./errors/ServerError");
const debugConnection = (0, import_debug.default)("colyseus:connection");
const debugDriver = (0, import_debug.default)("colyseus:driver");
const debugError = (0, import_debug.default)("colyseus:errors");
const debugMatchMaking = (0, import_debug.default)("colyseus:matchmaking");
const debugMessage = (0, import_debug.default)("colyseus:message");
const debugPatch = (0, import_debug.default)("colyseus:patch");
const debugPresence = (0, import_debug.default)("colyseus:presence");
const debugAndPrintError = (e) => {
  const message = e instanceof Error ? e.stack : e;
  if (!(e instanceof import_ServerError.ServerError)) {
    import_Logger.logger.error(message);
  }
  debugError.call(debugError, message);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  debugAndPrintError,
  debugConnection,
  debugDriver,
  debugError,
  debugMatchMaking,
  debugMessage,
  debugPatch,
  debugPresence
});
