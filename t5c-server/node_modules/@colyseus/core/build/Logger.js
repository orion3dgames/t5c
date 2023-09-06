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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var Logger_exports = {};
__export(Logger_exports, {
  Logger: () => Logger,
  logger: () => logger,
  setLogger: () => setLogger
});
module.exports = __toCommonJS(Logger_exports);
class Logger {
  debug(...args) {
    logger.debug(...args);
  }
  error(...args) {
    logger.error(...args);
  }
  info(...args) {
    logger.info(...args);
  }
  trace(...args) {
    logger.trace(...args);
  }
  warn(...args) {
    logger.warn(...args);
  }
}
let logger = console;
function setLogger(instance) {
  logger = instance;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Logger,
  logger,
  setLogger
});
