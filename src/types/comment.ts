import {
    CommentStatement,
    CommentClassElement,
    CommentTypeElement,
    CommentObjectLiteralElement,
    CommentEnumMember,
} from "ts-morph";

type Comment =
    | CommentStatement
    | CommentClassElement
    | CommentTypeElement
    | CommentObjectLiteralElement
    | CommentEnumMember;

export type { Comment };
