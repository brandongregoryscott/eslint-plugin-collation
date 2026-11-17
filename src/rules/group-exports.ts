import { RuleName } from "../enums/rule-name";
import isEmpty from "lodash/isEmpty";
import { isExportNamedDeclaration } from "../utils/node-utils";
import type { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/rule-utils";
import {
    stringifyCommentedNodes,
    groupNodesWithComments,
} from "../utils/node-comment-utils";
import type { CommentedNode } from "../utils/node-comment-utils";
import { exportListRange } from "../utils/ast";

interface ExportEdit {
    range: TSESTree.Range;
    text: string;
}

const groupExports = createRule({
    name: RuleName.GroupExports,
    meta: {
        type: "suggestion",
        docs: { description: "Group exports from the same module." },
        fixable: "code",
        schema: [],
        messages: { groupExports: "Combine these export declarations." },
    },
    defaultOptions: [],
    create(context) {
        const source = context.sourceCode;

        function findGroups() {
            const groups = new Map<string, TSESTree.ExportNamedDeclaration[]>();

            for (const node of source.ast.body) {
                if (
                    !isExportNamedDeclaration(node) ||
                    node.declaration != null
                ) {
                    continue;
                }

                const key = JSON.stringify([
                    node.exportKind,
                    node.source?.value,
                    node.attributes
                        .map((attribute) => [
                            source.getText(attribute.key),
                            attribute.value.value,
                        ])
                        .sort(),
                ]);

                const group = groups.get(key) ?? [];

                group.push(node);
                groups.set(key, group);
            }

            return [...groups.values()].filter((group) => group.length > 1);
        }

        function readExport(
            node: TSESTree.ExportNamedDeclaration,
            listRange: TSESTree.Range,
            retainEnvelope: boolean
        ) {
            const index = source.ast.body.indexOf(node);
            const previous = source.ast.body[index - 1];

            // The first statement's preceding comments are the file header.
            const leading =
                previous == null
                    ? []
                    : source
                          .getCommentsBefore(node)
                          .filter(
                              (comment) =>
                                  comment.loc.start.line > previous.loc.end.line
                          );

            const trailing = source
                .getCommentsAfter(node)
                .filter(
                    (comment) => comment.loc.start.line === node.loc.end.line
                );

            const items = groupNodesWithComments(
                source,
                node.specifiers,
                listRange
            );
            const inside = source.getCommentsInside(node);
            const beforeList = retainEnvelope
                ? []
                : inside.filter((comment) => comment.range[1] <= listRange[0]);
            const afterList = retainEnvelope
                ? []
                : inside.filter((comment) => comment.range[0] >= listRange[1]);

            const range: TSESTree.Range = [
                leading[0]?.range[0] ?? node.range[0],
                trailing[trailing.length - 1]?.range[1] ?? node.range[1],
            ];

            if (isEmpty(items)) {
                return {
                    items,
                    range,
                    emptyComments: [
                        ...leading,
                        ...beforeList,
                        ...inside.filter(
                            (comment) =>
                                comment.range[0] >= listRange[0] &&
                                comment.range[1] <= listRange[1]
                        ),
                        ...afterList,
                        ...trailing,
                    ],
                };
            }

            items[0].leading.unshift(...leading, ...beforeList);
            items[items.length - 1].trailing.push(...afterList, ...trailing);

            return { items, range, emptyComments: [] };
        }

        function removalRange([start, end]: TSESTree.Range): TSESTree.Range {
            // Remove an otherwise empty line with the statement. Leave file
            // headers, footers, and statements sharing the line in place.
            const lineStart = source.text.lastIndexOf("\n", start - 1) + 1;
            const nextLine = source.text.indexOf("\n", end);

            if (
                source.text.slice(lineStart, start).trim() === "" &&
                (nextLine === -1 ||
                    source.text.slice(end, nextLine).trim() === "")
            ) {
                start = Math.max(
                    0,
                    lineStart - (source.text[lineStart - 2] === "\r" ? 2 : 1)
                );
            }

            return [start, end];
        }

        function combine(
            group: TSESTree.ExportNamedDeclaration[]
        ): ExportEdit[] {
            const first = group[0];
            const firstRange = exportListRange(first, source);
            if (firstRange == null) {
                return [];
            }

            const items: CommentedNode[] = [];
            const edits: ExportEdit[] = [];
            let pending: TSESTree.Comment[] = [];

            for (const node of group) {
                const listRange = exportListRange(node, source);
                if (listRange == null) {
                    return [];
                }

                const entry = readExport(node, listRange, node === first);

                if (isEmpty(entry.items)) {
                    pending.push(...entry.emptyComments);
                } else {
                    entry.items[0].leading.unshift(...pending);
                    pending = [];
                    items.push(...entry.items);
                }

                edits.push({
                    range:
                        node === first
                            ? entry.range
                            : removalRange(entry.range),
                    text: "",
                });
            }

            if (!isEmpty(pending) && !isEmpty(items)) {
                items[items.length - 1].trailing.push(...pending);
            }

            let list = stringifyCommentedNodes(source, items);

            if (isEmpty(items) && !isEmpty(pending)) {
                list = `{\n${pending
                    .map((comment) => source.getText(comment))
                    .join(" ")} \n}`;
            }

            edits[0].text =
                source.text.slice(first.range[0], firstRange[0]) +
                list +
                source.text.slice(firstRange[1], first.range[1]);

            return edits;
        }

        return {
            "Program:exit"() {
                const groups = findGroups();
                const edits = groups.flatMap(combine);

                for (const group of groups) {
                    context.report({
                        node: group[0],
                        messageId: "groupExports",
                        fix: (fixer) =>
                            edits.map((edit) =>
                                fixer.replaceTextRange(edit.range, edit.text)
                            ),
                    });
                }
            },
        };
    },
});

export { groupExports };
