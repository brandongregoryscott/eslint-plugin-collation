import type { TSESTree } from "@typescript-eslint/utils";
import type { SourceCode } from "@typescript-eslint/utils/ts-eslint";

interface CommentedNode<T extends TSESTree.Node = TSESTree.Node> {
    leading: TSESTree.Comment[];
    node: T;
    trailing: TSESTree.Comment[];
}

/**
 * Associate standalone comments with the next node and same-line trailing comments
 * with the previous node. A block comment after a comma belongs to the next node.
 * Comments inside a node remain part of its original source text.
 */
const groupNodesWithComments = <T extends TSESTree.Node>(
    nodes: T[],
    range: TSESTree.Range,
    sourceCode: SourceCode
): CommentedNode<T>[] => {
    const groups = nodes.map((node) => ({
        node,
        leading: [] as TSESTree.Comment[],
        trailing: [] as TSESTree.Comment[],
    }));
    const comments = sourceCode
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
        const nextIndex = nodes.findIndex(
            (node) => node.range[0] >= comment.range[1]
        );
        const previous =
            groups[nextIndex === -1 ? groups.length - 1 : nextIndex - 1];
        const next = nextIndex === -1 ? undefined : groups[nextIndex];
        const comma =
            previous == null ? null : sourceCode.getTokenAfter(previous.node);
        const isTrailing =
            previous != null &&
            previous.node.loc.end.line === comment.loc.start.line &&
            (comment.type === "Line" ||
                comma?.value !== "," ||
                comment.range[0] < comma.range[0]);
        if (previous != null && (isTrailing || next == null)) {
            previous.trailing.push(comment);
        } else {
            next?.leading.push(comment);
        }
    }
    return groups;
};

const hasGroupComments = (groups: CommentedNode[]): boolean =>
    groups.some(
        (group) => group.leading.length > 0 || group.trailing.length > 0
    );

/** Print commas before trailing line comments so line comments never swallow syntax. */
const printCommentedList = (
    groups: CommentedNode[],
    sourceCode: SourceCode,
    padded: boolean,
    range: TSESTree.Range
): string => {
    const newline = sourceCode.text.includes("\r\n") ? "\r\n" : "\n";
    const multiline =
        groups.some(
            (group) =>
                [...group.leading, ...group.trailing].some(
                    (comment) =>
                        comment.type === "Line" ||
                        comment.loc.start.line !== comment.loc.end.line
                ) || sourceCode.getText(group.node).includes("\n")
        ) ||
        (hasGroupComments(groups) &&
            sourceCode.text.slice(...range).includes("\n"));
    const lineStart = sourceCode.text.lastIndexOf("\n", range[0] - 1) + 1;
    const baseIndent =
        sourceCode.text.slice(lineStart, range[0]).match(/^\s*/)?.[0] ?? "";
    const itemIndent =
        groups
            .map(({ node }) => {
                const line = sourceCode.lines[node.loc.start.line - 1] ?? "";
                const prefix = line.slice(0, node.loc.start.column);
                return /^[ \t]+$/.test(prefix) ? prefix : undefined;
            })
            .find((indent) => indent != null) ?? baseIndent + "    ";
    const parts = groups.map((group, index) => {
        const leading = group.leading.map((comment) =>
            sourceCode.getText(comment)
        );
        const comma = index < groups.length - 1 || multiline ? "," : "";
        let text = sourceCode.getText(group.node);
        let commaPrinted = false;
        for (const [commentIndex, comment] of group.trailing.entries()) {
            const previousWasLine =
                group.trailing[commentIndex - 1]?.type === "Line";
            if (comment.type === "Line" && !commaPrinted) {
                text += comma;
                commaPrinted = true;
            }
            text +=
                (previousWasLine ? newline + itemIndent : " ") +
                sourceCode.getText(comment);
        }
        if (!commaPrinted) {
            text += comma;
        }
        if (multiline) {
            return [
                ...leading.map((comment) => itemIndent + comment),
                itemIndent + text,
            ].join(newline);
        }
        return [...leading, text].join(" ");
    });
    if (multiline) {
        return newline + parts.join(newline) + newline + baseIndent;
    }
    const padding = padded && parts.length > 0 ? " " : "";
    return padding + parts.join(" ") + padding;
};

const printComments = (
    comments: TSESTree.Comment[],
    sourceCode: SourceCode
): string =>
    comments
        .map(
            (comment) =>
                sourceCode.getText(comment) +
                (comment.type === "Line"
                    ? sourceCode.text.includes("\r\n")
                        ? "\r\n"
                        : "\n"
                    : " ")
        )
        .join("");

export type { CommentedNode };
export { groupNodesWithComments, printCommentedList, printComments };
