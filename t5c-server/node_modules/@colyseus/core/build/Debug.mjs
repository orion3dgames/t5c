import debug from "debug";
import { logger } from "./Logger";
import { ServerError } from "./errors/ServerError";
const debugConnection = debug("colyseus:connection");
const debugDriver = debug("colyseus:driver");
const debugError = debug("colyseus:errors");
const debugMatchMaking = debug("colyseus:matchmaking");
const debugMessage = debug("colyseus:message");
const debugPatch = debug("colyseus:patch");
const debugPresence = debug("colyseus:presence");
const debugAndPrintError = (e) => {
  const message = e instanceof Error ? e.stack : e;
  if (!(e instanceof ServerError)) {
    logger.error(message);
  }
  debugError.call(debugError, message);
};
export {
  debugAndPrintError,
  debugConnection,
  debugDriver,
  debugError,
  debugMatchMaking,
  debugMessage,
  debugPatch,
  debugPresence
};
