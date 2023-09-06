import argv from "./argv";
import { generate } from "./api";

const supportedTargets = {
    csharp: 'generate for C#/Unity',
    cpp: 'generate for C++',
    haxe: 'generate for Haxe',
    ts: 'generate for TypeScript',
    js: 'generate for JavaScript',
    java: 'generate for Java',
    lua: 'generate for LUA',
}

function displayHelp() {
    console.log(`\nschema-codegen [path/to/Schema.ts]

Usage (C#/Unity)
    schema-codegen src/Schema.ts --output client-side/ --csharp --namespace MyGame.Schema

Valid options:
    --output: the output directory for generated client-side schema files
${Object.
    keys(supportedTargets).
    map((targetId) => (
`    --${targetId}: ${supportedTargets[targetId]}`
    )).
    join("\n")}

Optional:
    --namespace: generate namespace on output code
    --decorator: custom name for @type decorator to scan for`);
    process.exit();
}

const args = argv(process.argv.slice(2));
if (args.help) {
    displayHelp();
}

let targetId: string;
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
    generate(targetId, {
        files: args._,
        decorator: args.decorator,
        output: args.output,
        namespace: args.namespace
    });

} catch (e) {
    console.error(e.message);
    console.error(e.stack);
    displayHelp();
}
