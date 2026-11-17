import type { FunctionNode } from "../utils/ast";
import { RuleName } from "../enums/rule-name";
import { SafetyClassification } from "../enums/safety-classification";
import { ParameterMover } from "../utils/parameter-mover";
import { createRule } from "../utils/rule-utils";

const noDestructuredParameter = createRule({
    create(context) {
        const mover = new ParameterMover(context.sourceCode);

        function check(node: FunctionNode) {
            const moves = mover.plan({ baseName: "parameter", node });
            const safe =
                mover.safety(node, moves) === SafetyClassification.Safe;

            for (const move of moves) {
                context.report({
                    fix: safe
                        ? (fixer) => mover.fix(node, moves, fixer)
                        : undefined,
                    messageId: "destructureInBody",
                    node: move.pattern,
                });
            }
        }

        return {
            ArrowFunctionExpression: check,
            FunctionDeclaration: check,
            FunctionExpression: check,
            TSCallSignatureDeclaration: check,
            TSConstructorType: check,
            TSConstructSignatureDeclaration: check,
            TSDeclareFunction: check,
            TSEmptyBodyFunctionExpression: check,
            TSFunctionType: check,
            TSMethodSignature: check,
        };
    },
    defaultOptions: [],
    meta: {
        docs: { description: "Destructure parameters in the function body." },
        fixable: "code",
        messages: {
            destructureInBody:
                "Move parameter destructuring into the function body.",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.NoDestructuredParameter,
});

export { noDestructuredParameter };
