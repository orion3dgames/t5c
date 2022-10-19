"use strict";

import * as functions from "firebase-functions";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * IMPORTANT:
 * ---------
 * Do not manually edit this file if you'd like to use Colyseus Arena
 *
 * If you're self-hosting (without Arena), you can manually instantiate a
 * Colyseus Server as documented here: 👉 https://docs.colyseus.io/server/api/#constructor-options
 */
const arena_1 = require("@colyseus/arena");
// Import arena config
const arena_config_1 = require("./arena.config");
// Create and listen on 2567 (or PORT environment variable.)
arena_1.listen(arena_config_1.default);
//# sourceMappingURL=index.js.map

exports.app = functions.https.onRequest(arena_1);