import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { Declaration } from "../types/declaration";

const getName = (node?: TSESTree.Node | null): string | undefined => {
    if (node == null) {
        return undefined;
    }

    switch (node.type) {
        case AST_NODE_TYPES.ClassDeclaration:
        case AST_NODE_TYPES.FunctionDeclaration:
        case AST_NODE_TYPES.TSEnumDeclaration:
        case AST_NODE_TYPES.TSInterfaceDeclaration:
        case AST_NODE_TYPES.TSTypeAliasDeclaration:
            return node.id?.name;
        case AST_NODE_TYPES.VariableDeclaration:
            const declarator = node.declarations.find(
                (declarator) => declarator.id.type === AST_NODE_TYPES.Identifier
            );

            if (declarator == null) {
                return undefined;
            }

            return (declarator.id as TSESTree.Identifier).name;
        default:
            return undefined;
    }
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

export { getName, isDeclaration, isInlineExport };
