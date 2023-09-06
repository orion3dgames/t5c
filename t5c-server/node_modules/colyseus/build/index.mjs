export * from "@colyseus/core";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
Server.prototype["getDefaultTransport"] = function(options) {
  return new WebSocketTransport(options);
};
import { RedisPresence } from "@colyseus/redis-presence";
import { RedisDriver } from "@colyseus/redis-driver";
export {
  RedisDriver,
  RedisPresence
};
