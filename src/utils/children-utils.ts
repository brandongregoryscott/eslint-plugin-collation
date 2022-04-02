import { flatMap } from "lodash";
import { Node, SyntaxKind } from "ts-morph";

const getChildrenOfKind = <T extends SyntaxKind>(node: Node, ...kinds: T[]) =>
    flatMap(kinds, (kind) => node.getChildrenOfKind(kind));

export { getChildrenOfKind };
