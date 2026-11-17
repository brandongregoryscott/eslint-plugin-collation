import type { TSESTree } from "@typescript-eslint/utils";
import isEqual from "lodash/isEqual";
import orderBy from "lodash/orderBy";
import { RuleName } from "../enums/rule-name";
import {
    stringifyCommentedNodes,
    groupNodesWithComments,
} from "../utils/node-comment-utils";
import {
    isArrayExpression,
    isIdentifier,
    isMemberExpression,
} from "../utils/node-utils";
import { createRule } from "../utils/rule-utils";

// Restrict sorting to identifier paths; computed access and call results can
// evaluate side effects even when the outer node is a member expression.
function isDependencyReference(node: null | TSESTree.Node): boolean {
    return (
        isIdentifier(node) ||
        (isMemberExpression(node) &&
            !node.computed &&
            isDependencyReference(node.object))
    );
}

const HOOK_NAMES = ["useEffect", "useMemo", "useCallback"];

const sortDependencyList = createRule({
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

                const [, list] = node.arguments;

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

                if (isEqual(items, sorted)) {
                    return;
                }

                context.report({
                    fix: (fixer) =>
                        fixer.replaceText(
                            list,
                            stringifyCommentedNodes(source, sorted, "[]")
                        ),
                    messageId: "sortDependencyList",
                    node: list,
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: { description: "Sort hook dependencies." },
        fixable: "code",
        messages: { sortDependencyList: "Sort the dependency list." },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.SortDependencyList,
});

export { sortDependencyList };
