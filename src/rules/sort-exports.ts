import { hasSameOrder } from "../utils/collection-utils";
import { orderBy, findLast } from "lodash";
import { isIdentifier } from "../utils/node-utils";
import { createRule } from "../utils/create-rule";
import { printList, readList } from "../utils/commented-list";
import type { TSESTree } from "@typescript-eslint/utils";

type Range = [number, number];

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

                const open = source
                    .getTokens(node)
                    .find((token) => token.value === "{");

                const close = findLast(
                    source.getTokens(node),
                    (token) => token.value === "}"
                );

                if (open == null || close == null) {
                    return;
                }

                const range: Range = [open.range[0], close.range[1]];
                const items = readList(source, node.specifiers, range);

                const reordered = sorted.map(
                    (item) => items[specifiers.indexOf(item)]
                );

                context.report({
                    node,
                    messageId: "sortExports",
                    fix: (fixer) =>
                        fixer.replaceTextRange(
                            range,
                            printList(source, reordered)
                        ),
                });
            },
        };
    },
});

export { sortExports };
