import isEmpty from "lodash/isEmpty";
import type { FunctionNode } from "../utils/ast";
import { RuleName } from "../enums/rule-name";
import { SafetyClassification } from "../enums/safety-classification";
import { ParameterMover } from "../utils/parameter-mover";
import { ReactComponentDetector } from "../utils/react-component-detector";
import { createRule } from "../utils/rule-utils";

const noDestructuredPropsParameter = createRule({
    create(context) {
        const mover = new ParameterMover(context.sourceCode);
        const react = new ReactComponentDetector(context.sourceCode);

        function check(node: FunctionNode) {
            if (!react.isComponent(node)) {
                return;
            }

            const moves = mover.plan({
                baseName: "props",
                firstOnly: true,
                node,
            });

            if (isEmpty(moves)) {
                return;
            }

            const safety = mover.safety(node, moves);

            context.report({
                fix:
                    safety === SafetyClassification.Safe
                        ? (fixer) => mover.fix(node, moves, fixer)
                        : undefined,
                messageId: "destructureInBody",
                node: moves[0].pattern,
                suggest:
                    safety === SafetyClassification.Review
                        ? [
                              {
                                  fix: (fixer) => mover.fix(node, moves, fixer),
                                  messageId: "reviewDestructureInBody",
                              },
                          ]
                        : [],
            });
        }

        return {
            ArrowFunctionExpression: check,
            FunctionDeclaration: check,
            FunctionExpression: check,
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description: "Destructure component props in the function body.",
        },
        fixable: "code",
        hasSuggestions: true,
        messages: {
            destructureInBody:
                "Move props destructuring into the function body.",
            reviewDestructureInBody:
                "Move destructuring into the body after reviewing evaluation order.",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.NoDestructuredPropsParameter,
});

export { noDestructuredPropsParameter };
