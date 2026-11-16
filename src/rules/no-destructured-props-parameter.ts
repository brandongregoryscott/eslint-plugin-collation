import { RuleName } from "../enums/rule-name";
import { SafetyClassification } from "../enums/safety-classification";
import { isEmpty } from "lodash";
import { createRule } from "../utils/rule-utils";
import type { FunctionNode } from "../utils/ast";
import { ParameterMover } from "../utils/parameter-mover";
import { ReactComponentDetector } from "../utils/react-component-detector";

const noDestructuredPropsParameter = createRule({
    name: RuleName.NoDestructuredPropsParameter,
    meta: {
        type: "suggestion",
        docs: {
            description: "Destructure component props in the function body.",
        },
        fixable: "code",
        hasSuggestions: true,
        schema: [],
        messages: {
            destructureInBody:
                "Move props destructuring into the function body.",
            reviewDestructureInBody:
                "Move destructuring into the body after reviewing evaluation order.",
        },
    },
    defaultOptions: [],
    create(context) {
        const mover = new ParameterMover(context.sourceCode);
        const react = new ReactComponentDetector(context.sourceCode);

        function check(node: FunctionNode) {
            if (!react.isComponent(node)) {
                return;
            }

            const moves = mover.plan({
                node,
                baseName: "props",
                firstOnly: true,
            });
            if (isEmpty(moves)) {
                return;
            }

            const safety = mover.safety(node, moves);

            context.report({
                node: moves[0].pattern,
                messageId: "destructureInBody",
                fix:
                    safety === SafetyClassification.Safe
                        ? (fixer) => mover.fix(node, moves, fixer)
                        : undefined,
                suggest:
                    safety === SafetyClassification.Review
                        ? [
                              {
                                  messageId: "reviewDestructureInBody",
                                  fix: (fixer) => mover.fix(node, moves, fixer),
                              },
                          ]
                        : [],
            });
        }

        return {
            FunctionDeclaration: check,
            FunctionExpression: check,
            ArrowFunctionExpression: check,
        };
    },
});

export { noDestructuredPropsParameter };
