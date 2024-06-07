import { TSESTree, AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { Declaration } from "../types/declaration";
import { arrify } from "./collection-utils";
import { isString } from "./core-utils";

/**
 * Returns the full text of the ImportSpecifier, taking into account aliasing, i.e.
 * Box as MyBox
 */
const getImportSpecifierText = (
    specifier: TSESTree.ImportSpecifier | string
) => {
    if (isString(specifier)) {
        return specifier;
    }

    const name = getName(specifier);
    const alias = specifier.local.name;
    const isAliased = alias !== name;
    if (isAliased) {
        return `${name} as ${alias}`;
    }

    return name;
};

const getName = (
    node: TSESTree.Node | null | undefined
): string | undefined => {
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
        case AST_NODE_TYPES.ImportSpecifier:
            return node.imported.name;
        default:
            return undefined;
    }
};

const getModuleSpecifier = (
    importDeclaration: TSESTree.ImportDeclaration
): string => importDeclaration.source.value;

const isCommaToken = (
    token: TSESTree.Token | null | undefined
): token is TSESTree.PunctuatorToken =>
    token?.type === TSESTree.AST_TOKEN_TYPES.Punctuator && token.value === ",";

const isDeclaration = (node: TSESTree.Node): node is Declaration =>
    [
        AST_NODE_TYPES.ClassDeclaration,
        AST_NODE_TYPES.FunctionDeclaration,
        AST_NODE_TYPES.TSEnumDeclaration,
        AST_NODE_TYPES.VariableDeclaration,
    ].includes(node.type);

const isIdentifierToken = (
    token: TSESTree.Token | undefined,
    value?: string
): token is TSESTree.IdentifierToken => {
    const isIdentifier = token?.type === TSESTree.AST_TOKEN_TYPES.Identifier;
    if (value != null) {
        return isIdentifier && token.value === value;
    }

    return isIdentifier;
};

const isImportDeclaration = (
    node: TSESTree.Node | TSESTree.Token | null | undefined
): node is TSESTree.ImportDeclaration =>
    node?.type === TSESTree.AST_NODE_TYPES.ImportDeclaration;

const isImportSpecifier = (
    node: TSESTree.ImportClause | null | undefined
): node is TSESTree.ImportSpecifier =>
    node?.type === TSESTree.AST_NODE_TYPES.ImportSpecifier;

const toDefaultImportDeclaration = (
    specifier: string,
    moduleSpecifier: string
): string => `import ${specifier} from '${moduleSpecifier}';`;

const toImportDeclaration = (
    specifiers: string[] | string,
    moduleSpecifier: string
): string =>
    `import { ${arrify(specifiers).join(", ")} } from '${moduleSpecifier}';`;

const isIdentifier = (node: TSESTree.Node): node is TSESTree.Identifier =>
    node.type === AST_NODE_TYPES.Identifier;

export {
    getImportSpecifierText,
    getModuleSpecifier,
    getName,
    isCommaToken,
    isDeclaration,
    isIdentifier,
    isIdentifierToken,
    isImportDeclaration,
    isImportSpecifier,
    toDefaultImportDeclaration,
    toImportDeclaration,
};
