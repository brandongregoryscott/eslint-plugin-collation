import { hasSameOrder } from "../utils/collection-utils";
import { orderBy } from "lodash";
import { isIdentifier } from "../utils/node-utils";
import { createRule } from "../utils/rule-utils";
import {
    stringifyCommentedNodes,
    groupNodesWithComments,
} from "../utils/node-comment-utils";
import type { TSESTree } from "@typescript-eslint/utils";
import { exportListRange } from "../utils/ast";

const sortExports = createRule({
    name: "sort-exports",
    meta: {
        type: "suggestion",
        docs: { description: "Sort named exports." },
        fixable: "code",
        schema: [],
        messages: { sortExports: "Sort the export specifiers." },
    },
    defaultOptions: [],
    create(context) {
        const source = context.sourceCode;

        return {
            ExportNamedDeclaration(node) {
                if (node.declaration != null || node.specifiers.length < 2) {
                    return;
                }

                const specifiers = [...node.specifiers];

                const name = (specifier: TSESTree.ExportSpecifier) =>
                    isIdentifier(specifier.exported)
                        ? specifier.exported.name
                        : specifier.exported.value;

                const sorted = orderBy(
                    specifiers,
                    [(specifier) => name(specifier).toLowerCase(), name],
                    ["asc", "desc"]
                );

                if (hasSameOrder(node.specifiers, sorted)) {
                    return;
                }

                const range = exportListRange(node, source);
                if (range == null) {
                    return;
                }

                const items = groupNodesWithComments(
                    source,
                    node.specifiers,
                    range
                );

                const reordered = sorted.map(
                    (item) => items[specifiers.indexOf(item)]
                );

                context.report({
                    node,
                    messageId: "sortExports",
                    fix: (fixer) =>
                        fixer.replaceTextRange(
                            range,
                            stringifyCommentedNodes(source, reordered)
                        ),
                });
            },
        };
    },
});

export { sortExports };
