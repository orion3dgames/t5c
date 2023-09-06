var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
__export(src_exports, {
  RedisDriver: () => import_redis_driver.RedisDriver,
  RedisPresence: () => import_redis_presence.RedisPresence
});
module.exports = __toCommonJS(src_exports);
__reExport(src_exports, require("@colyseus/core"), module.exports);
var import_core = require("@colyseus/core");
var import_ws_transport = require("@colyseus/ws-transport");
var import_redis_presence = require("@colyseus/redis-presence");
var import_redis_driver = require("@colyseus/redis-driver");
import_core.Server.prototype["getDefaultTransport"] = function(options) {
  return new import_ws_transport.WebSocketTransport(options);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RedisDriver,
  RedisPresence
});
