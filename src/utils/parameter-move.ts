import {
    isAssignmentPattern,
    isBlockStatement,
    isCallExpression,
    isExpressionStatement,
    isIdentifier,
    isMethodDefinition,
    isProperty,
    isRestElement,
    isTSAbstractMethodDefinition,
} from "./node-utils";
import type { TSESTree } from "@typescript-eslint/utils";
import type {
    RuleContext,
    RuleFixer,
} from "@typescript-eslint/utils/ts-eslint";
import { declarationNames, descendants, freshName, isPattern } from "./ast";
import type { FunctionNode, Pattern } from "./ast";

interface ParameterMove {
    declaration: string;
    pattern: Pattern;
    replacement: string;
}

type MoveContext = RuleContext<
    "destructureInBody" | "reviewDestructureInBody",
    readonly unknown[]
>;

// This factory owns one file's source and scopes. Its helpers only need the
// function being transformed, rather than carrying context through every call.
function parameterMover(context: MoveContext) {
    const source = context.sourceCode;

    function plan(node: FunctionNode, baseName: string, firstOnly = false) {
        const used = new Set<string>();

        for (const child of descendants(node, source)) {
            if (isIdentifier(child)) {
                used.add(child.name);
            }
        }

        const moves: ParameterMove[] = [];
        const params = firstOnly ? node.params.slice(0, 1) : node.params;

        for (const original of params) {
            let param: TSESTree.Node = original;

            if (isAssignmentPattern(param)) {
                param = param.left;
            }

            if (isRestElement(param)) {
                param = param.argument;
            }

            if (!isPattern(param)) {
                continue;
            }

            const name = freshName(baseName, used);
            const annotation = param.typeAnnotation;
            const end = annotation?.range[0] ?? param.range[1];

            const patternText = source.text
                .slice(param.range[0], end)
                .trimEnd();

            // Whitespace before a type annotation is part of the moved pattern
            // when it contains a line comment.
            const text = source.text.slice(param.range[0], end);
            const bindingText = text.includes("//") ? text : patternText;

            const variables = source
                .getDeclaredVariables(node)
                .filter((variable) =>
                    variable.identifiers.some(
                        (id) =>
                            id.range[0] >= param.range[0] && id.range[1] <= end
                    )
                );

            const mutable = variables.some((variable) =>
                variable.references.some(
                    (reference) =>
                        reference.isWrite() && reference.init !== true
                )
            );

            moves.push({
                pattern: param,
                replacement: name,
                declaration: `${
                    mutable ? "let" : "const"
                } ${bindingText} = ${name};`,
            });
        }

        return moves;
    }

    // Some transformations need review; others cannot be offered at all. Keep
    // those decisions explicit, because they protect evaluation order and scope.
    function safety(
        node: FunctionNode,
        moves: ParameterMove[]
    ): "safe" | "review" | "blocked" {
        if (!("body" in node) || node.body == null || node.body == null) {
            return "blocked";
        }

        if (
            ("async" in node && node.async) ||
            ("generator" in node && node.generator)
        ) {
            return "blocked";
        }

        if (
            (isMethodDefinition(node.parent) ||
                isTSAbstractMethodDefinition(node.parent)) &&
            node.parent.kind === "constructor"
        ) {
            return "blocked";
        }

        const bodyStart = node.body.range[0];

        const names = new Set(
            moves.flatMap((move) => declarationNames(move.pattern))
        );

        const variables = source
            .getDeclaredVariables(node)
            .filter((variable) => names.has(variable.name));

        if (variables.some((variable) => variable.defs.length > 1)) {
            return "blocked";
        }

        for (const child of descendants(node.body, source)) {
            if (isIdentifier(child) && child.name === "arguments") {
                return "blocked";
            }

            if (
                isCallExpression(child) &&
                isIdentifier(child.callee) &&
                child.callee.name === "eval"
            ) {
                return "blocked";
            }
        }

        // References in a later parameter initializer would lose access to the
        // binding after it moves into the body.
        if (
            variables.some((variable) =>
                variable.references.some(
                    (reference) =>
                        reference.identifier.range[0] < bodyStart &&
                        reference.init !== true
                )
            )
        ) {
            return "blocked";
        }

        let review = false;

        for (const param of node.params) {
            for (const child of descendants(param, source)) {
                if (
                    isAssignmentPattern(child) ||
                    (isProperty(child) && child.computed)
                ) {
                    review = true;
                }
            }
        }

        return review ? "review" : "safe";
    }

    function fix(node: FunctionNode, moves: ParameterMove[], fixer: RuleFixer) {
        if (!("body" in node) || node.body == null) {
            return null;
        }

        const fixes = moves.map((move) =>
            fixer.replaceTextRange(
                [
                    move.pattern.range[0],
                    move.pattern.typeAnnotation?.range[0] ??
                        move.pattern.range[1],
                ],
                move.replacement
            )
        );

        const declarations = moves.map((move) => move.declaration).join("\n");

        if (isBlockStatement(node.body)) {
            let position = node.body.range[0] + 1;

            for (const statement of node.body.body) {
                if (
                    !isExpressionStatement(statement) ||
                    statement.directive == null
                ) {
                    break;
                }

                position = statement.range[1];
            }

            fixes.push(
                fixer.insertTextAfterRange(
                    [position, position],
                    `\n${declarations}\n`
                )
            );
        } else {
            const arrow = source.getTokenBefore(
                node.body,
                (token) => token.value === "=>"
            );

            if (arrow == null) {
                return null;
            }

            // Start after => to retain parentheses and comments excluded from
            // the expression node's range.
            const start = arrow.range[1];
            const end = node.range[1];
            const expression = source.text.slice(start, end).trim();

            fixes.push(
                fixer.replaceTextRange(
                    [start, end],
                    ` {\n${declarations}\nreturn (\n${expression}\n);\n}`
                )
            );
        }

        return fixes;
    }

    return { fix, plan, safety };
}

export { parameterMover };
