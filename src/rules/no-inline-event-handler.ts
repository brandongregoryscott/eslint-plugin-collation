import { RuleName } from "../enums/rule-name";
import { createRule } from "../utils/rule-utils";

const noInlineEventHandler = createRule({
    create: (context) => ({
        ['JSXAttribute[name.name=/^on[A-Z]/] > JSXExpressionContainer :matches(ArrowFunctionExpression, FunctionExpression, CallExpression[callee.property.name="bind"])']:
            (node) => {
                context.report({ node, messageId: "extractHandler" });
            },
    }),
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "Require JSX event handlers to be declared outside JSX",
        },
        messages: {
            extractHandler:
                "Extract this JSX event handler into a named function before the JSX.",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.NoInlineEventHandler,
});

export { noInlineEventHandler };
