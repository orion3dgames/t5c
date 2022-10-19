"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = exports.MyRoomState = exports.Player = void 0;
const schema_1 = require("@colyseus/schema");
class Player extends schema_1.Schema {
    constructor() {
        super(...arguments);
        // Player ID
        this.id = "ID";
        //Position
        this.xPos = 0.0;
        this.yPos = 0.0;
        this.zPos = 0.0;
        //Rotation
        this.xRot = 0.0;
        this.yRot = 0.0;
        this.zRot = 0.0;
        //Interpolation values
        this.timestamp = 0.0;
        this.username = "";
    }
}
__decorate([
    schema_1.type("string")
], Player.prototype, "id", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "xPos", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "yPos", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "zPos", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "xRot", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "yRot", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "zRot", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "timestamp", void 0);
__decorate([
    schema_1.type("string")
], Player.prototype, "username", void 0);
exports.Player = Player;
//
class MyRoomState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.players = new schema_1.MapSchema();
        this.serverTime = 0.0;
    }
}
__decorate([
    schema_1.type({ map: Player })
], MyRoomState.prototype, "players", void 0);
__decorate([
    schema_1.type("number")
], MyRoomState.prototype, "serverTime", void 0);
exports.MyRoomState = MyRoomState;
//Chat related schemas
class ChatMessage extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.senderID = "";
        this.message = "";
        this.timestamp = 0.0;
        this.createdAt = Date.now();
    }
}
__decorate([
    schema_1.type("string")
], ChatMessage.prototype, "senderID", void 0);
__decorate([
    schema_1.type("string")
], ChatMessage.prototype, "message", void 0);
__decorate([
    schema_1.type("number")
], ChatMessage.prototype, "timestamp", void 0);
__decorate([
    schema_1.type("number")
], ChatMessage.prototype, "createdAt", void 0);
exports.ChatMessage = ChatMessage;
//# sourceMappingURL=MyRoomState.js.map