import { compact, chain, first, merge } from "lodash";
import { CommentRange, Node, Structure } from "ts-morph";
import { PrimitiveComment } from "../models/primitive-comment";
import { Comment } from "../types/comment";
import { NodeCommentGroup } from "../types/node-comment-group";

interface GroupingOptions<T extends Node = Node> {
    getDescendants?: (node: T) => Array<Node>;
    /**
     * When true, parses out `CommentRanges` into `PrimitiveComment` objects. For nodes that have
     * built-in comment association (such as `EnumDeclaration` or `InterfaceDeclaration`, this
     * can break the standard association process)
     */
    parseCommentRanges?: boolean;
    selector?: (node: T) => boolean;
}

const defaultOptions: GroupingOptions = {
    parseCommentRanges: false,
    getDescendants: (node) => node.getDescendants(),
};

const getCommentText = (comment: Comment): string => comment.getFullText();

const getNodeCommentGroups = <
    TInputNode extends Node,
    TOutputNode extends Node
>(
    node: TInputNode,
    options?: GroupingOptions<TInputNode>
): Array<NodeCommentGroup<TOutputNode>> => {
    const {
        getDescendants = defaultOptions.getDescendants,
        selector,
        parseCommentRanges = defaultOptions.parseCommentRanges,
    } = options ?? defaultOptions;
    const commentsOrNodes = chain(getDescendants?.(node))
        .map((node, index, descendants) =>
            getNodeOrComment(
                node as TInputNode,
                index,
                descendants as Array<Node>,
                selector,
                parseCommentRanges
            )
        )
        .flatten() // Flatten tuple arrays that may contain comments
        .compact() // Filter out `undefined` values (i.e. nodes that have no `CommentRange` instances)
        .thru((values) => values as Array<Comment | TOutputNode>)
        .value();

    const groups = commentsOrNodes.map(toNodeCommentGroup);

    return compact(groups);
};

const getCommentNodeStructures = <
    TNode extends Node,
    TStructure extends Structure
>(
    groups: Array<NodeCommentGroup<TNode>>
): Array<TStructure> =>
    groups.map(
        (group) =>
            merge(
                {},
                Node.hasStructure(group.node) ? group.node.getStructure() : {},
                {
                    leadingTrivia: group.comment?.getText(),
                }
            ) as TStructure
    );

const getNodeOrComment = <T extends Node>(
    node: T,
    index: number,
    descendants: Array<Node>,
    selector?: (node: T) => boolean,
    parseCommentRanges: boolean = false
): [PrimitiveComment, T] | T | Comment | [] => {
    if (Node.isCommentNode(node)) {
        return node;
    }

    if (selector != null && !selector(node as T)) {
        return [];
    }

    if (!parseCommentRanges) {
        return node;
    }

    // As of writing, ts-morph only wraps a specific set of CommentRange nodes that are associated
    // with other nodes. This is some what of a manual hack to associate the first `CommentRange`
    // with any arbitrary node, assuming it is placed above the node.
    const leadingCommentRange: CommentRange | undefined = first(
        node.getLeadingCommentRanges()
    );

    const hasNoComment = leadingCommentRange == null;
    const hasDuplicateOfPreviousComment = isEqual(
        descendants[index - 1],
        leadingCommentRange
    );
    if (hasNoComment || hasDuplicateOfPreviousComment) {
        return node;
    }

    return [new PrimitiveComment(leadingCommentRange), node];
};

const isComment = (node: any): node is Comment =>
    node instanceof PrimitiveComment || Node.isCommentNode(node);

const isEqual = (
    left?: Node | Comment | CommentRange,
    right?: Node | Comment | CommentRange
) => left != null && right != null && left.getText() === right.getText();

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

export { getNodeCommentGroups, getCommentNodeStructures, getCommentText };
