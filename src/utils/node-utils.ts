import { functions, isFunction } from "lodash";
import { Node } from "ts-morph";
import { Comment } from "../types/comment";
import { isComment, removeComment } from "./comment-utils";

const safelyRemove = <T extends Node | Comment>(node: T) => {
    if (node.wasForgotten()) {
        return;
    }

    if (isComment(node)) {
        removeComment(node);
        return;
    }

    const unsafeNodeCast = node as any;
    if (!isFunction(unsafeNodeCast.remove)) {
        return;
    }

    unsafeNodeCast.remove();
};

const safelyRemoveAll = <T extends Node | Comment>(nodes: Array<T>) =>
    nodes.forEach(safelyRemove);

export { safelyRemove, safelyRemoveAll };
