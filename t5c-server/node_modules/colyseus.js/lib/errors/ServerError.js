"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerError = exports.CloseCode = void 0;
var CloseCode;
(function (CloseCode) {
    CloseCode[CloseCode["CONSENTED"] = 4000] = "CONSENTED";
    CloseCode[CloseCode["DEVMODE_RESTART"] = 4010] = "DEVMODE_RESTART";
})(CloseCode = exports.CloseCode || (exports.CloseCode = {}));
class ServerError extends Error {
    constructor(code, message) {
        super(message);
        this.name = "ServerError";
        this.code = code;
    }
}
exports.ServerError = ServerError;
//# sourceMappingURL=ServerError.js.map