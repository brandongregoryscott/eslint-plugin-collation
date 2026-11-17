import type { TSESTree } from "@typescript-eslint/utils";
import { RuleName } from "../enums/rule-name";
import { isIdentifier } from "../utils/node-utils";
import { createRule } from "../utils/rule-utils";

const preferNativePrivateSyntax = createRule({
    create(context) {
        function check(
            node: TSESTree.MethodDefinition | TSESTree.PropertyDefinition
        ) {
            if (node.accessibility !== "private") {
                return;
            }

            context.report({
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
                messageId: "preferPrivateHash",
                node,
            });
        }

        return { MethodDefinition: check, PropertyDefinition: check };
    },
    defaultOptions: [],
    meta: {
        docs: { description: "Use native private members." },
        fixable: "code",
        messages: { preferPrivateHash: "Use native private syntax." },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.PreferNativePrivateSyntax,
});

export { preferNativePrivateSyntax };
