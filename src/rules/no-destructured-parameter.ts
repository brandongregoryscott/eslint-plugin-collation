import { createRule } from "../utils/create-rule";
import type { FunctionNode } from "../utils/ast";
import { parameterMover } from "../utils/parameter-move";

const noDestructuredParameter = createRule({
    name: "no-destructured-parameter",
    meta: {
        type: "suggestion",
        docs: { description: "Destructure parameters in the function body." },
        fixable: "code",
        schema: [],
        messages: {
            destructureInBody:
                "Move parameter destructuring into the function body.",
        },
    },
    defaultOptions: [],
    create(context) {
        const mover = parameterMover(context);

        function check(node: FunctionNode) {
            const moves = mover.plan(node, "parameter");
            const safe = mover.safety(node, moves) === "safe";

            for (const move of moves) {
                context.report({
                    node: move.pattern,
                    messageId: "destructureInBody",
                    fix: safe
                        ? (fixer) => mover.fix(node, moves, fixer)
                        : undefined,
                });
            }
        }

        return {
            FunctionDeclaration: check,
            FunctionExpression: check,
            ArrowFunctionExpression: check,
            TSDeclareFunction: check,
            TSEmptyBodyFunctionExpression: check,
            TSMethodSignature: check,
            TSFunctionType: check,
            TSConstructorType: check,
            TSCallSignatureDeclaration: check,
            TSConstructSignatureDeclaration: check,
        };
    },
});

export { noDestructuredParameter };
