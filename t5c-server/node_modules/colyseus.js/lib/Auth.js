"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = exports.Platform = void 0;
const http = __importStar(require("httpie"));
const Storage_1 = require("./Storage");
const TOKEN_STORAGE = "colyseus-auth-token";
var Platform;
(function (Platform) {
    Platform["ios"] = "ios";
    Platform["android"] = "android";
})(Platform = exports.Platform || (exports.Platform = {}));
class Auth {
    constructor(endpoint) {
        this._id = undefined;
        this.username = undefined;
        this.displayName = undefined;
        this.avatarUrl = undefined;
        this.isAnonymous = undefined;
        this.email = undefined;
        this.lang = undefined;
        this.location = undefined;
        this.timezone = undefined;
        this.metadata = undefined;
        this.devices = undefined;
        this.facebookId = undefined;
        this.twitterId = undefined;
        this.googleId = undefined;
        this.gameCenterId = undefined;
        this.steamId = undefined;
        this.friendIds = undefined;
        this.blockedUserIds = undefined;
        this.createdAt = undefined;
        this.updatedAt = undefined;
        // auth token
        this.token = undefined;
        this.endpoint = endpoint.replace("ws", "http");
        (0, Storage_1.getItem)(TOKEN_STORAGE, (token) => this.token = token);
    }
    get hasToken() {
        return !!this.token;
    }
    login(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryParams = Object.assign({}, options);
            if (this.hasToken) {
                queryParams.token = this.token;
            }
            const data = yield this.request('post', '/auth', queryParams);
            // set & cache token
            this.token = data.token;
            (0, Storage_1.setItem)(TOKEN_STORAGE, this.token);
            for (let attr in data) {
                if (this.hasOwnProperty(attr)) {
                    this[attr] = data[attr];
                }
            }
            this.registerPingService();
            return this;
        });
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.request('put', '/auth', {}, {
                username: this.username,
                displayName: this.displayName,
                avatarUrl: this.avatarUrl,
                lang: this.lang,
                location: this.location,
                timezone: this.timezone,
            });
            return this;
        });
    }
    getFriends() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.request('get', '/friends/all'));
        });
    }
    getOnlineFriends() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.request('get', '/friends/online'));
        });
    }
    getFriendRequests() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.request('get', '/friends/requests'));
        });
    }
    sendFriendRequest(friendId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.request('post', '/friends/requests', { userId: friendId }));
        });
    }
    acceptFriendRequest(friendId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.request('put', '/friends/requests', { userId: friendId }));
        });
    }
    declineFriendRequest(friendId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.request('del', '/friends/requests', { userId: friendId }));
        });
    }
    blockUser(friendId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.request('post', '/friends/block', { userId: friendId }));
        });
    }
    unblockUser(friendId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.request('put', '/friends/block', { userId: friendId }));
        });
    }
    request(method, segments, query = {}, body, headers = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            headers['Accept'] = 'application/json';
            if (this.hasToken) {
                headers['Authorization'] = 'Bearer ' + this.token;
            }
            const queryParams = [];
            for (const name in query) {
                queryParams.push(`${name}=${query[name]}`);
            }
            const queryString = (queryParams.length > 0)
                ? `?${queryParams.join("&")}`
                : '';
            const opts = { headers };
            if (body) {
                opts.body = body;
            }
            return (yield http[method](`${this.endpoint}${segments}${queryString}`, opts)).data;
        });
    }
    logout() {
        this.token = undefined;
        (0, Storage_1.removeItem)(TOKEN_STORAGE);
        this.unregisterPingService();
    }
    registerPingService(timeout = 15000) {
        this.unregisterPingService();
        this.keepOnlineInterval = setInterval(() => this.request('get', '/auth'), timeout);
    }
    unregisterPingService() {
        clearInterval(this.keepOnlineInterval);
    }
}
exports.Auth = Auth;
//# sourceMappingURL=Auth.js.map