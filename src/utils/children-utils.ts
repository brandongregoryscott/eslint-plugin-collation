import { compact, first, flatMap } from "lodash";
import { Node, SyntaxKind } from "ts-morph";

const getChildrenOfKind = <T extends SyntaxKind>(node: Node, ...kinds: T[]) =>
    flatMap(kinds, (kind) => node.getChildrenOfKind(kind));

const getFirstChildOfKind = <T extends SyntaxKind>(
    node: Node,
    ...kinds: T[]
) => {
    const children = flatMap(kinds, (kind) => node.getFirstChildByKind(kind));
    return first(compact(children));
};

export { getChildrenOfKind, getFirstChildOfKind };
