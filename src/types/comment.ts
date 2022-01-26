import {
    CommentStatement,
    CommentClassElement,
    CommentTypeElement,
    CommentObjectLiteralElement,
    CommentEnumMember,
} from "ts-morph";
import { PrimitiveComment } from "../models/primitive-comment";

type Comment =
    | CommentStatement
    | CommentClassElement
    | CommentTypeElement
    | CommentObjectLiteralElement
    | CommentEnumMember
    | PrimitiveComment;

export type { Comment };
