import { RuleName } from "../enums/rule-name";
import { SafetyClassification } from "../enums/safety-classification";
import { createRule } from "../utils/rule-utils";
import type { FunctionNode } from "../utils/ast";
import { ParameterMover } from "../utils/parameter-mover";

const noDestructuredParameter = createRule({
    name: RuleName.NoDestructuredParameter,
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
        const mover = new ParameterMover(context.sourceCode);

        function check(node: FunctionNode) {
            const moves = mover.plan(node, "parameter");
            const safe =
                mover.safety(node, moves) === SafetyClassification.Safe;

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
