import { isEmpty } from "lodash";
import { createRule } from "../utils/create-rule";
import type { FunctionNode } from "../utils/ast";
import { parameterMover } from "../utils/parameter-move";
import { reactComponents } from "../utils/react-component";

const noDestructuredPropsParameter = createRule({
    name: "no-destructured-props-parameter",
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
        const mover = parameterMover(context);
        const react = reactComponents(context.sourceCode);

        function check(node: FunctionNode) {
            if (!react.isComponent(node)) {
                return;
            }

            const moves = mover.plan(node, "props", true);
            if (isEmpty(moves)) {
                return;
            }

            const safety = mover.safety(node, moves);

            context.report({
                node: moves[0].pattern,
                messageId: "destructureInBody",
                fix:
                    safety === "safe"
                        ? (fixer) => mover.fix(node, moves, fixer)
                        : undefined,
                suggest:
                    safety === "review"
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
