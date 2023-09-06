"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const argv_1 = require("./argv");
const api_1 = require("./api");
const supportedTargets = {
    csharp: 'generate for C#/Unity',
    cpp: 'generate for C++',
    haxe: 'generate for Haxe',
    ts: 'generate for TypeScript',
    js: 'generate for JavaScript',
    java: 'generate for Java',
    lua: 'generate for LUA',
};
function displayHelp() {
    console.log(`\nschema-codegen [path/to/Schema.ts]

Usage (C#/Unity)
    schema-codegen src/Schema.ts --output client-side/ --csharp --namespace MyGame.Schema

Valid options:
    --output: the output directory for generated client-side schema files
${Object.
        keys(supportedTargets).
        map((targetId) => (`    --${targetId}: ${supportedTargets[targetId]}`)).
        join("\n")}

Optional:
    --namespace: generate namespace on output code
    --decorator: custom name for @type decorator to scan for`);
    process.exit();
}
const args = (0, argv_1.default)(process.argv.slice(2));
if (args.help) {
    displayHelp();
}
let targetId;
for (let target in supportedTargets) {
    if (args[target]) {
        targetId = target;
    }
}
if (!args.output) {
    console.error("You must provide a valid --output directory.");
    displayHelp();
}
try {
    args.files = args._;
    (0, api_1.generate)(targetId, {
        files: args._,
        decorator: args.decorator,
        output: args.output,
        namespace: args.namespace
    });
}
catch (e) {
    console.error(e.message);
    console.error(e.stack);
    displayHelp();
}
//# sourceMappingURL=cli.js.map