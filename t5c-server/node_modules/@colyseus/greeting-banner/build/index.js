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
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var src_default = process.env.COLYSEUS_CLOUD ? String.raw`
   ______      __                              ________                __
  / ____/___  / /_  __________  __  _______   / ____/ /___  __  ______/ /
 / /   / __ \/ / / / / ___/ _ \/ / / / ___/  / /   / / __ \/ / / / __  /
/ /___/ /_/ / / /_/ (__  )  __/ /_/ (__  )  / /___/ / /_/ / /_/ / /_/ /
\____/\____/_/\__, /____/\___/\__,_/____/   \____/_/\____/\__,_/\__,_/
             /____/

🚀 Thank you for using Colyseus Cloud
❓ If you need help please reach out on support@colyseus.io
` : String.raw`
       ___      _
      / __\___ | |_   _ ___  ___ _   _ ___
     / /  / _ \| | | | / __|/ _ \ | | / __|
    / /__| (_) | | |_| \__ \  __/ |_| \__ \
    \____/\___/|_|\__, |___/\___|\__,_|___/
                  |___/

Multiplayer Framework for Node.js · Open-source

💖 Sponsor Colyseus on GitHub → https://github.com/sponsors/endel
🌟 Give it a star on GitHub → https://github.com/colyseus/colyseus
☁️  Deploy and scale your project on Colyseus Cloud → https://cloud.colyseus.io
`;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
