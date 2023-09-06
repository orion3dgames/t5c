import * as ts from "typescript";
import { Class, Interface, Context, Enum } from "./types";
export declare function parseFiles(fileNames: string[], decoratorName?: string, context?: Context): {
    classes: Class[];
    interfaces: Interface[];
    enums: Enum[];
};
/**
 * TypeScript 4.8+ has introduced a change on how to access decorators.
 * - https://github.com/microsoft/TypeScript/pull/49089
 * - https://devblogs.microsoft.com/typescript/announcing-typescript-4-8/#decorators-are-placed-on-modifiers-on-typescripts-syntax-trees
 */
export declare function getDecorators(node: ts.Node | null | undefined): undefined | ts.Decorator[];
