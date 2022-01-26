import { Node } from "ts-morph";
import { Comment } from "./comment";

interface NodeCommentGroup<T extends Node> {
    comment?: Comment;
    node: T;
}

export type { NodeCommentGroup };
