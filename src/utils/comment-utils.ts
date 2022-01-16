import { compact } from "lodash";
import { Node } from "ts-morph";
import { Comment } from "../types/comment";
import { NodeCommentGroup } from "../types/node-comment-group";

const getNodeCommentGroups = <T extends Node>(
    node: Node,
    selector: (node: Node) => boolean
): Array<NodeCommentGroup<T>> => {
    const commentsOrNodes = node
        .getDescendants()
        .filter((node) => Node.isCommentNode(node) || selector(node)) as Array<
        Comment | T
    >;

    const groups = commentsOrNodes.map(toNodeCommentGroup);

    return compact(groups);
};

const toNodeCommentGroup = <T extends Node>(
    commentOrNode: T | Comment,
    index: number,
    commentsOrNodes: Array<T | Comment>
) => {
    if (Node.isCommentNode(commentOrNode)) {
        return;
    }
    const previousNode = commentsOrNodes[index - 1];

    return {
        node: commentOrNode,
        comment: Node.isCommentNode(previousNode) ? previousNode : undefined,
    };
};

export { getNodeCommentGroups };
