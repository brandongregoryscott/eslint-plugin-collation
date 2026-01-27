import type { TSESTree } from "@typescript-eslint/utils";
import type { RuleFix, RuleFixer } from "@typescript-eslint/utils/ts-eslint";
import { RuleName } from "../enums/rule-name";
import { createRule } from "../utils/rule-utils";

type MessageIds = "preferPrivateHash";

type PrivateMemberNode =
    | TSESTree.PropertyDefinition
    | TSESTree.MethodDefinition;

const preferNativePrivateSyntax = createRule<never[], MessageIds>({
    create: (context) => {
        const sourceCode = context.sourceCode;

        const handlePrivateMember = (node: PrivateMemberNode): void => {
            const memberName = (node.key as TSESTree.Identifier).name;

            context.report({
                node,
                messageId: "preferPrivateHash",
                data: { name: memberName },
                fix: (fixer: RuleFixer): RuleFix[] => {
                    const fixes: RuleFix[] = [];

                    const privateKeyword = sourceCode.getFirstToken(node);
                    if (privateKeyword && privateKeyword.value === "private") {
                        fixes.push(fixer.remove(privateKeyword));

                        const nextToken =
                            sourceCode.getTokenAfter(privateKeyword);
                        if (nextToken) {
                            const spaceRange: [number, number] = [
                                privateKeyword.range[1],
                                nextToken.range[0],
                            ];
                            fixes.push(fixer.removeRange(spaceRange));
                        }
                    }

                    fixes.push(fixer.replaceText(node.key, `#${memberName}`));

                    return fixes;
                },
            });
        };

        return {
            'PropertyDefinition[accessibility="private"]': handlePrivateMember,
            'MethodDefinition[accessibility="private"]': handlePrivateMember,
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "Prefer native #private class members over TypeScript private modifier",
        },
        fixable: "code",
        messages: {
            preferPrivateHash:
                "Use native `#{{name}}` syntax instead of TypeScript `private {{name}}` for true runtime privacy.",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.PreferNativePrivateSyntax,
});

export { preferNativePrivateSyntax };
