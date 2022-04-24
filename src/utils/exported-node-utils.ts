import { first } from "lodash";
import { Node } from "ts-morph";
import { ExportedNode } from "../types/exported-node";
import { NamedExportStructure } from "../types/named-export-structure";
import {
    getEofExportDeclarations,
    getExportNames,
} from "./export-declaration-utils";

const getExportedNodeName = (
    exportedNode: ExportedNode
): string | undefined => {
    if (Node.isVariableStatement(exportedNode)) {
        return first(exportedNode.getDeclarations())?.getName();
    }

    if (!Node.hasName(exportedNode)) {
        return;
    }

    return exportedNode.getName();
};

const isEofExportedNode = (exportedNode: ExportedNode): boolean => {
    const name = getExportedNodeName(exportedNode);
    if (name == null) {
        return false;
    }

    const file = exportedNode.getSourceFile();
    const eofStatements = getEofExportDeclarations(file);
    const exportNames = getExportNames(eofStatements);

    return exportNames.includes(name);
};

const isInlineExportedNode = (exportedNode: ExportedNode): boolean =>
    !isEofExportedNode(exportedNode);

const toNamedExportStructure = (
    exportedNode: ExportedNode
): NamedExportStructure | undefined => {
    const name = getExportedNodeName(exportedNode);
    if (name == null) {
        return;
    }

    return {
        name,
        isType:
            Node.isTypeAliasDeclaration(exportedNode) ||
            Node.isInterfaceDeclaration(exportedNode),
    };
};

export {
    getExportedNodeName,
    isEofExportedNode,
    isInlineExportedNode,
    toNamedExportStructure,
};
