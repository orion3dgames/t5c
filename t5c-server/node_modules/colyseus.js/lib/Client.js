"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.MatchMakeError = void 0;
const httpie_1 = require("httpie");
const ServerError_1 = require("./errors/ServerError");
const Room_1 = require("./Room");
class MatchMakeError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        Object.setPrototypeOf(this, MatchMakeError.prototype);
    }
}
exports.MatchMakeError = MatchMakeError;
// - React Native does not provide `window.location`
// - Cocos Creator (Native) does not provide `window.location.hostname`
const DEFAULT_ENDPOINT = (typeof (window) !== "undefined" && typeof ((_a = window === null || window === void 0 ? void 0 : window.location) === null || _a === void 0 ? void 0 : _a.hostname) !== "undefined")
    ? `${window.location.protocol.replace("http", "ws")}//${window.location.hostname}${(window.location.port && `:${window.location.port}`)}`
    : "ws://127.0.0.1:2567";
class Client {
    constructor(settings = DEFAULT_ENDPOINT) {
        if (typeof (settings) === "string") {
            //
            // endpoint by url
            //
            const url = new URL(settings);
            const secure = (url.protocol === "https:" || url.protocol === "wss:");
            const port = Number(url.port || (secure ? 443 : 80));
            this.settings = {
                hostname: url.hostname,
                pathname: url.pathname !== "/" ? url.pathname : "",
                port,
                secure
            };
        }
        else {
            //
            // endpoint by settings
            //
            if (settings.port === undefined) {
                settings.port = (settings.secure) ? 443 : 80;
            }
            if (settings.pathname === undefined) {
                settings.pathname = "";
            }
            this.settings = settings;
        }
    }
    joinOrCreate(roomName, options = {}, rootSchema) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.createMatchMakeRequest('joinOrCreate', roomName, options, rootSchema);
        });
    }
    create(roomName, options = {}, rootSchema) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.createMatchMakeRequest('create', roomName, options, rootSchema);
        });
    }
    join(roomName, options = {}, rootSchema) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.createMatchMakeRequest('join', roomName, options, rootSchema);
        });
    }
    joinById(roomId, options = {}, rootSchema) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.createMatchMakeRequest('joinById', roomId, options, rootSchema);
        });
    }
    /**
     * Re-establish connection with a room this client was previously connected to.
     *
     * @param reconnectionToken The `room.reconnectionToken` from previously connected room.
     * @param rootSchema (optional) Concrete root schema definition
     * @returns Promise<Room>
     */
    reconnect(reconnectionToken, rootSchema) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof (reconnectionToken) === "string" && typeof (rootSchema) === "string") {
                throw new Error("DEPRECATED: .reconnect() now only accepts 'reconnectionToken' as argument.\nYou can get this token from previously connected `room.reconnectionToken`");
            }
            const [roomId, token] = reconnectionToken.split(":");
            return yield this.createMatchMakeRequest('reconnect', roomId, { reconnectionToken: token }, rootSchema);
        });
    }
    getAvailableRooms(roomName = "") {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield (0, httpie_1.get)(this.getHttpEndpoint(`${roomName}`), {
                headers: {
                    'Accept': 'application/json'
                }
            })).data;
        });
    }
    consumeSeatReservation(response, rootSchema, reuseRoomInstance // used in devMode
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            const room = this.createRoom(response.room.name, rootSchema);
            room.roomId = response.room.roomId;
            room.sessionId = response.sessionId;
            const options = { sessionId: room.sessionId };
            // forward "reconnection token" in case of reconnection.
            if (response.reconnectionToken) {
                options.reconnectionToken = response.reconnectionToken;
            }
            const targetRoom = reuseRoomInstance || room;
            room.connect(this.buildEndpoint(response.room, options), response.devMode && (() => __awaiter(this, void 0, void 0, function* () {
                console.info(`[Colyseus devMode]: ${String.fromCodePoint(0x1F504)} Re-establishing connection with room id '${room.roomId}'...`); // 🔄
                let retryCount = 0;
                let retryMaxRetries = 8;
                const retryReconnection = () => __awaiter(this, void 0, void 0, function* () {
                    retryCount++;
                    try {
                        yield this.consumeSeatReservation(response, rootSchema, targetRoom);
                        console.info(`[Colyseus devMode]: ${String.fromCodePoint(0x2705)} Successfully re-established connection with room '${room.roomId}'`); // ✅
                    }
                    catch (e) {
                        if (retryCount < retryMaxRetries) {
                            console.info(`[Colyseus devMode]: ${String.fromCodePoint(0x1F504)} retrying... (${retryCount} out of ${retryMaxRetries})`); // 🔄
                            setTimeout(retryReconnection, 2000);
                        }
                        else {
                            console.info(`[Colyseus devMode]: ${String.fromCodePoint(0x274C)} Failed to reconnect. Is your server running? Please check server logs.`); // ❌
                        }
                    }
                });
                setTimeout(retryReconnection, 2000);
            })), targetRoom);
            return new Promise((resolve, reject) => {
                const onError = (code, message) => reject(new ServerError_1.ServerError(code, message));
                targetRoom.onError.once(onError);
                targetRoom['onJoin'].once(() => {
                    targetRoom.onError.remove(onError);
                    resolve(targetRoom);
                });
            });
        });
    }
    createMatchMakeRequest(method, roomName, options = {}, rootSchema, reuseRoomInstance) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = (yield (0, httpie_1.post)(this.getHttpEndpoint(`${method}/${roomName}`), {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(options)
            })).data;
            if (response.error) {
                throw new MatchMakeError(response.error, response.code);
            }
            // forward reconnection token during "reconnect" methods.
            if (method === "reconnect") {
                response.reconnectionToken = options.reconnectionToken;
            }
            return yield this.consumeSeatReservation(response, rootSchema, reuseRoomInstance);
        });
    }
    createRoom(roomName, rootSchema) {
        return new Room_1.Room(roomName, rootSchema);
    }
    buildEndpoint(room, options = {}) {
        const params = [];
        for (const name in options) {
            if (!options.hasOwnProperty(name)) {
                continue;
            }
            params.push(`${name}=${options[name]}`);
        }
        let endpoint = (this.settings.secure)
            ? "wss://"
            : "ws://";
        if (room.publicAddress) {
            endpoint += `${room.publicAddress}`;
        }
        else {
            endpoint += `${this.settings.hostname}${this.getEndpointPort()}${this.settings.pathname}`;
        }
        return `${endpoint}/${room.processId}/${room.roomId}?${params.join('&')}`;
    }
    getHttpEndpoint(segments = '') {
        return `${(this.settings.secure) ? "https" : "http"}://${this.settings.hostname}${this.getEndpointPort()}${this.settings.pathname}/matchmake/${segments}`;
    }
    getEndpointPort() {
        return (this.settings.port !== 80 && this.settings.port !== 443)
            ? `:${this.settings.port}`
            : "";
    }
}
exports.Client = Client;
//# sourceMappingURL=Client.js.map