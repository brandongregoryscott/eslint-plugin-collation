import {
    ExportableNode,
    ModifierableNode,
    Node,
    VariableStatement,
} from "ts-morph";

type ExportedNode =
    | (ExportableNode &
          // ExportableNodeExtensionType is an internal ts-morph type alias for Node & ModifierableNode
          Node &
          ModifierableNode)
    | VariableStatement;

export type { ExportedNode };
