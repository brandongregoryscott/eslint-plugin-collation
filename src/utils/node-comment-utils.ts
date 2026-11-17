import isEmpty from "lodash/isEmpty";
import type { TSESTree } from "@typescript-eslint/utils";
import type { SourceCode } from "@typescript-eslint/utils/ts-eslint";

interface CommentedNode {
    leading: TSESTree.Comment[];
    text: string;
    trailing: TSESTree.Comment[];
}

// Keep ownership separate from formatting so sorting and splitting use the same rules.
function groupNodesWithComments(
    source: SourceCode,
    nodes: TSESTree.Node[],
    range: TSESTree.Range
): CommentedNode[] {
    const items = nodes.map(
        (node): CommentedNode => ({
            leading: [],
            text: source.getText(node),
            trailing: [],
        })
    );

    const comments = source
        .getAllComments()
        .filter(
            (comment) =>
                comment.range[0] >= range[0] && comment.range[1] <= range[1]
        );

    for (const comment of comments) {
        if (
            nodes.some(
                (node) =>
                    comment.range[0] >= node.range[0] &&
                    comment.range[1] <= node.range[1]
            )
        ) {
            continue;
        }

        const next = nodes.findIndex(
            (node) => node.range[0] >= comment.range[1]
        );

        const previous = next === -1 ? nodes.length - 1 : next - 1;

        // A block comment after a comma introduces the next item. A line comment
        // on the previous item's line belongs to that item, even after its comma.
        const afterPrevious =
            previous >= 0 &&
            nodes[previous].loc.end.line === comment.loc.start.line;

        const commaBefore =
            previous >= 0 &&
            source.text
                .slice(nodes[previous].range[1], comment.range[0])
                .includes(",");

        if (afterPrevious && (comment.type === "Line" || !commaBefore)) {
            items[previous].trailing.push(comment);
        } else if (next !== -1) {
            items[next].leading.push(comment);
        } else if (previous >= 0) {
            items[previous].trailing.push(comment);
        }
    }

    return items;
}

function stringifyComments(
    comments: TSESTree.Comment[],
    source: SourceCode
): string {
    const newline = source.text.includes("\r\n") ? "\r\n" : "\n";

    return comments
        .map(
            (comment) =>
                source.getText(comment) +
                (comment.type === "Line" ? newline : " ")
        )
        .join("");
}

function stringifyCommentedNodes(
    source: SourceCode,
    items: CommentedNode[],
    brackets = "{}",
    multiline = false
): string {
    const newline = source.text.includes("\r\n") ? "\r\n" : "\n";
    const commentText = (comment: TSESTree.Comment) => source.getText(comment);

    multiline ||= items.some((item) =>
        [...item.leading, ...item.trailing].some(
            (comment) => comment.type === "Line"
        )
    );

    if (!multiline) {
        const rendered = items.map((item) => {
            const parts = [
                ...item.leading.map(commentText),
                item.text,
                ...item.trailing.map(commentText),
            ];

            return parts.filter((part) => part !== "").join(" ");
        });

        const contents = rendered.join(", ");

        return brackets === "[]" ? `[${contents}]` : `{ ${contents} }`;
    }

    const lines: string[] = [];

    for (const item of items) {
        for (const comment of item.leading) {
            lines.push(`    ${commentText(comment)}`);
        }

        const blocks = item.trailing
            .filter((comment) => comment.type !== "Line")
            .map(commentText);

        const tails = item.trailing
            .filter((comment) => comment.type === "Line")
            .map(commentText);

        lines.push(
            `    ${[item.text, ...blocks].join(" ")},${
                !isEmpty(tails) ? ` ${tails.join(" ")}` : ""
            }`
        );
    }

    return `${brackets[0]}${newline}${lines.join(newline)}${newline}${
        brackets[1]
    }`;
}

export type { CommentedNode };
export { groupNodesWithComments, stringifyCommentedNodes, stringifyComments };
