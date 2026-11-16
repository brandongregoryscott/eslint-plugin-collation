import { isArray } from "lodash";
import {
    isArrayPattern,
    isAssignmentPattern,
    isBlockStatement,
    isIdentifier,
    isMethodDefinition,
    isObjectPattern,
    isProgram,
    isProperty,
    isRestElement,
    isTSAbstractMethodDefinition,
    isTSMethodSignature,
    isTSModuleBlock,
    isVariableDeclaration,
    isVariableDeclarator,
} from "./node-utils";
import type { TSESTree } from "@typescript-eslint/utils";
import type { SourceCode } from "@typescript-eslint/utils/ts-eslint";

type FunctionNode =
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression
    | TSESTree.TSDeclareFunction
    | TSESTree.TSEmptyBodyFunctionExpression
    | TSESTree.TSMethodSignature
    | TSESTree.TSFunctionType
    | TSESTree.TSConstructorType
    | TSESTree.TSCallSignatureDeclaration
    | TSESTree.TSConstructSignatureDeclaration;

type Pattern = TSESTree.ObjectPattern | TSESTree.ArrayPattern;

function isPattern(node: TSESTree.Node): node is Pattern {
    return isObjectPattern(node) || isArrayPattern(node);
}

function* descendants(
    node: TSESTree.Node,
    source: SourceCode,
    skipFunctions = false
): Generator<TSESTree.Node> {
    yield node;

    for (const key of source.visitorKeys[node.type] ?? []) {
        const value = (node as unknown as Record<string, unknown>)[key];
        const children = isArray(value) ? value : [value];

        for (const child of children) {
            if (
                child == null ||
                typeof child !== "object" ||
                !("type" in child)
            ) {
                continue;
            }

            const next = child as TSESTree.Node;

            if (
                skipFunctions &&
                [
                    "FunctionDeclaration",
                    "FunctionExpression",
                    "ArrowFunctionExpression",
                ].includes(next.type)
            ) {
                continue;
            }

            yield* descendants(next, source, skipFunctions);
        }
    }
}

function functionName(node: FunctionNode): string | undefined {
    if ("id" in node && isIdentifier(node.id)) {
        return node.id.name;
    }

    const parent = node.parent;

    if (isVariableDeclarator(parent) && isIdentifier(parent.id)) {
        return parent.id.name;
    }

    if (
        (isMethodDefinition(parent) ||
            isTSAbstractMethodDefinition(parent) ||
            isProperty(parent)) &&
        isIdentifier(parent.key)
    ) {
        return parent.key.name;
    }

    if (isTSMethodSignature(node) && isIdentifier(node.key)) {
        return node.key.name;
    }

    return undefined;
}

function statementContainer(node: TSESTree.Node): TSESTree.Node {
    let current = node;

    while (
        current.parent &&
        !isProgram(current.parent) &&
        !isBlockStatement(current.parent) &&
        !isTSModuleBlock(current.parent)
    ) {
        current = current.parent;
    }

    return current;
}

function declarationNames(node: TSESTree.Node): string[] {
    if (isIdentifier(node)) {
        return [node.name];
    }

    if (isVariableDeclaration(node)) {
        return node.declarations.flatMap((item) => declarationNames(item.id));
    }

    if (isObjectPattern(node)) {
        return node.properties.flatMap((item) =>
            declarationNames(isRestElement(item) ? item.argument : item.value)
        );
    }

    if (isArrayPattern(node)) {
        return node.elements.flatMap((item) =>
            item == null ? [] : declarationNames(item)
        );
    }

    if (isRestElement(node)) {
        return declarationNames(node.argument);
    }

    if (isAssignmentPattern(node)) {
        return declarationNames(node.left);
    }

    if ("id" in node && isIdentifier(node.id)) {
        return [node.id.name];
    }

    return [];
}

// The list ends immediately after its last specifier, before any import
// attributes. For an empty list, the first closing brace follows the opener.
function exportListRange(
    node: TSESTree.ExportNamedDeclaration,
    source: SourceCode
): TSESTree.Range | undefined {
    const open = source.getFirstToken(node, (token) => token.value === "{");
    if (open == null) {
        return undefined;
    }

    const last = node.specifiers[node.specifiers.length - 1] ?? open;
    const close = source.getTokenAfter(last, (token) => token.value === "}");
    if (close == null) {
        return undefined;
    }

    return [open.range[0], close.range[1]];
}

function freshName(base: string, used: Set<string>): string {
    let name = base;

    for (let suffix = 2; used.has(name); suffix++) {
        name = `${base}${suffix}`;
    }

    used.add(name);

    return name;
}

export type { FunctionNode, Pattern };
export {
    declarationNames,
    descendants,
    exportListRange,
    freshName,
    functionName,
    isPattern,
    statementContainer,
};
