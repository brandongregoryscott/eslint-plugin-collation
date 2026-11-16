import { hasSameOrder } from "../utils/collection-utils";
import { orderBy } from "lodash";
import {
    isArrayExpression,
    isIdentifier,
    isMemberExpression,
} from "../utils/node-utils";
import { createRule } from "../utils/rule-utils";
import {
    stringifyCommentedNodes,
    groupNodesWithComments,
} from "../utils/node-comment-utils";
import type { TSESTree } from "@typescript-eslint/utils";

// Restrict sorting to identifier paths; computed access and call results can
// evaluate side effects even when the outer node is a member expression.
function isDependencyReference(node: TSESTree.Node | null): boolean {
    return (
        isIdentifier(node) ||
        (isMemberExpression(node) &&
            !node.computed &&
            isDependencyReference(node.object))
    );
}

const HOOK_NAMES = ["useEffect", "useMemo", "useCallback"];

const sortDependencyList = createRule({
    name: "sort-dependency-list",
    meta: {
        type: "suggestion",
        docs: { description: "Sort hook dependencies." },
        fixable: "code",
        schema: [],
        messages: { sortDependencyList: "Sort the dependency list." },
    },
    defaultOptions: [],
    create(context) {
        const source = context.sourceCode;

        return {
            CallExpression(node) {
                if (
                    !isIdentifier(node.callee) ||
                    !HOOK_NAMES.includes(node.callee.name)
                ) {
                    return;
                }

                const list = node.arguments[1];

                if (
                    !isArrayExpression(list) ||
                    !list.elements.every(isDependencyReference)
                ) {
                    return;
                }

                const items = groupNodesWithComments(
                    source,
                    list.elements.filter((element) => element != null),
                    list.range
                );

                const sorted = orderBy(
                    items,
                    [(item) => item.text.toLowerCase(), (item) => item.text],
                    ["asc", "desc"]
                );

                if (hasSameOrder(items, sorted)) {
                    return;
                }

                context.report({
                    node: list,
                    messageId: "sortDependencyList",
                    fix: (fixer) =>
                        fixer.replaceText(
                            list,
                            stringifyCommentedNodes(source, sorted, "[]")
                        ),
                });
            },
        };
    },
});

export { sortDependencyList };
