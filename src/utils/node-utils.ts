import compact from "lodash/compact";
import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { Declaration } from "../types/declaration";

const getName = (node?: TSESTree.Node | null): string | undefined => {
    if (node == null) {
        return undefined;
    }

    switch (node.type) {
        case AST_NODE_TYPES.Identifier:
            return node.name;
        case AST_NODE_TYPES.ClassDeclaration:
        case AST_NODE_TYPES.FunctionDeclaration:
        case AST_NODE_TYPES.TSEnumDeclaration:
        case AST_NODE_TYPES.TSInterfaceDeclaration:
        case AST_NODE_TYPES.TSTypeAliasDeclaration:
            return getName(node.id);
        case AST_NODE_TYPES.VariableDeclaration:
            const declarator = node.declarations.find(
                (declarator) => declarator.id.type === AST_NODE_TYPES.Identifier
            );

            return getName(declarator?.id as TSESTree.Identifier | undefined);
        case AST_NODE_TYPES.ExportDefaultDeclaration:
            return getName(node.declaration);
        case AST_NODE_TYPES.ExportNamedDeclaration:
            // Named exports may contain multiple identifiers, so we'll assume this is a single/inline export
            return getName(node.declaration);
        default:
            return undefined;
    }
};

const getExportSpecifiers = (node: TSESTree.ExportNamedDeclaration): string[] =>
    compact(
        node.specifiers?.map((exportSpecifier) =>
            getName(exportSpecifier.local)
        ) ?? []
    );

const isChildOf = (child: TSESTree.Node, parent: TSESTree.Node): boolean => {
    let currentNode: TSESTree.Node = child;
    let isChild = false;

    while (currentNode.parent != null && !isChild) {
        isChild = currentNode.parent === parent;
        currentNode = currentNode.parent;
    }

    return isChild;
};

const isDeclaration = (node: TSESTree.Node): node is Declaration =>
    [
        AST_NODE_TYPES.ClassDeclaration,
        AST_NODE_TYPES.FunctionDeclaration,
        AST_NODE_TYPES.TSEnumDeclaration,
        AST_NODE_TYPES.VariableDeclaration,
    ].includes(node.type);

const isInlineExport = (
    namedExport: TSESTree.ExportNamedDeclaration
): boolean => namedExport.specifiers.length === 0;

export {
    getExportSpecifiers,
    getName,
    isChildOf,
    isDeclaration,
    isInlineExport,
};
