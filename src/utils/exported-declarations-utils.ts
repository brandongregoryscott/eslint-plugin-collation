import { ExportedDeclarations, Node, SourceFile } from "ts-morph";
import { ExportedNode } from "../types/exported-node";

const asExportedNode = (
    exportedDeclaration: ExportedDeclarations
): ExportedNode | undefined => {
    if (
        !Node.isExportable(exportedDeclaration) &&
        !Node.isVariableDeclaration(exportedDeclaration)
    ) {
        return;
    }

    const exportedNode = Node.isVariableDeclaration(exportedDeclaration)
        ? exportedDeclaration.getVariableStatement()
        : exportedDeclaration;

    return exportedNode;
};

const getExportedDeclarations = (file: SourceFile): ExportedDeclarations[] => {
    const exportMap = file.getExportedDeclarations();
    const aggregatedExportedDeclarations: ExportedDeclarations[] = [];
    exportMap.forEach((exportedDeclarations) => {
        aggregatedExportedDeclarations.push(...exportedDeclarations);
    });

    return aggregatedExportedDeclarations;
};

export { asExportedNode, getExportedDeclarations };
