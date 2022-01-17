import { compact, chain } from "lodash";
import { CommentRange, Node } from "ts-morph";
import { PrimitiveComment } from "../models/primitive-comment";
import { Comment } from "../types/comment";
import { NodeCommentGroup } from "../types/node-comment-group";

const getNodeCommentGroups = <T extends Node>(
    node: Node,
    selector: (node: Node) => boolean
): Array<NodeCommentGroup<T>> => {
    const commentsOrNodes = chain(node.getDescendants())
        .map((node, index, descendants) => {
            if (Node.isCommentNode(node)) {
                return node;
            }

            if (!selector(node)) {
                return [];
            }

            // As of writing, ts-morph only wraps a specific set of CommentRange nodes that are associated
            // with other nodes. This is some what of a manual hack to associate the first `CommentRange`
            // with any arbitrary node, assuming it is placed above the node.
            const leadingCommentRange: CommentRange | undefined =
                node.getLeadingCommentRanges()[0];

            const hasNoComment = leadingCommentRange == null;
            const hasDuplicateOfPreviousComment = isEqual(
                descendants[index - 1],
                leadingCommentRange
            );
            if (hasNoComment || hasDuplicateOfPreviousComment) {
                return node;
            }

            return [new PrimitiveComment(leadingCommentRange), node];
        })
        .flatten() // Flatten tuple arrays that may contain comments
        .compact() // Filter out `undefined` values (i.e. nodes that have no `CommentRange` instances)
        .thru((values) => values as Array<Comment | T>)
        .value();

    const groups = commentsOrNodes.map(toNodeCommentGroup);

    return compact(groups);
};

const getCommentText = (comment: Comment): string => comment.getFullText();

const isComment = (node: any): node is Comment =>
    node instanceof PrimitiveComment || Node.isCommentNode(node);

const isEqual = (
    left?: Node | Comment | CommentRange,
    right?: Node | Comment | CommentRange
) => left != null && right != null && left.getText() === right.getText();

const removeComment = (comment: Comment) => {
    if (comment.wasForgotten()) {
        return;
    }

    comment.remove();
};

const toNodeCommentGroup = <T extends Node>(
    commentOrNode: T | Comment,
    index: number,
    commentsOrNodes: Array<T | Comment>
): NodeCommentGroup<T> | undefined => {
    if (isComment(commentOrNode)) {
        return;
    }
    const previousNode = commentsOrNodes[index - 1];

    return {
        node: commentOrNode,
        comment: isComment(previousNode) ? previousNode : undefined,
    };
};

export { getNodeCommentGroups, getCommentText, isComment, removeComment };
