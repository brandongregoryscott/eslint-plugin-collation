import { RuleName } from "../enums/rule-name";
import { isIdentifier } from "../utils/node-utils";
import type { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/rule-utils";

const preferNativePrivateSyntax = createRule({
    name: RuleName.PreferNativePrivateSyntax,
    meta: {
        type: "suggestion",
        docs: { description: "Use native private members." },
        fixable: "code",
        schema: [],
        messages: { preferPrivateHash: "Use native private syntax." },
    },
    defaultOptions: [],
    create(context) {
        function check(
            node: TSESTree.PropertyDefinition | TSESTree.MethodDefinition
        ) {
            if (node.accessibility !== "private") {
                return;
            }

            context.report({
                node,
                messageId: "preferPrivateHash",
                fix(fixer) {
                    if (!isIdentifier(node.key) || node.computed) {
                        return null;
                    }

                    const keyword = context.sourceCode
                        .getTokens(node)
                        .find((token) => token.value === "private");

                    if (keyword == null) {
                        return null;
                    }

                    const end =
                        keyword.range[1] +
                        (context.sourceCode.text[keyword.range[1]] === " "
                            ? 1
                            : 0);

                    return [
                        fixer.removeRange([keyword.range[0], end]),
                        fixer.insertTextBefore(node.key, "#"),
                    ];
                },
            });
        }

        return { PropertyDefinition: check, MethodDefinition: check };
    },
});

export { preferNativePrivateSyntax };
