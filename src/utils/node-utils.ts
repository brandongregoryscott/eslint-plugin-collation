import type { TSESTree } from "@typescript-eslint/utils";

function isArrayExpression(
    node: null | TSESTree.Node | undefined
): node is TSESTree.ArrayExpression {
    return node?.type === "ArrayExpression";
}

function isArrayPattern(
    node: null | TSESTree.Node | undefined
): node is TSESTree.ArrayPattern {
    return node?.type === "ArrayPattern";
}

function isAssignmentPattern(
    node: null | TSESTree.Node | undefined
): node is TSESTree.AssignmentPattern {
    return node?.type === "AssignmentPattern";
}

function isBlockStatement(
    node: null | TSESTree.Node | undefined
): node is TSESTree.BlockStatement {
    return node?.type === "BlockStatement";
}

function isCallExpression(
    node: null | TSESTree.Node | undefined
): node is TSESTree.CallExpression {
    return node?.type === "CallExpression";
}

function isConditionalExpression(
    node: null | TSESTree.Node | undefined
): node is TSESTree.ConditionalExpression {
    return node?.type === "ConditionalExpression";
}

function isExportDefaultDeclaration(
    node: null | TSESTree.Node | undefined
): node is TSESTree.ExportDefaultDeclaration {
    return node?.type === "ExportDefaultDeclaration";
}

function isExportNamedDeclaration(
    node: null | TSESTree.Node | undefined
): node is TSESTree.ExportNamedDeclaration {
    return node?.type === "ExportNamedDeclaration";
}

function isExpressionStatement(
    node: null | TSESTree.Node | undefined
): node is TSESTree.ExpressionStatement {
    return node?.type === "ExpressionStatement";
}

function isIdentifier(
    node: null | TSESTree.Node | undefined
): node is TSESTree.Identifier {
    return node?.type === "Identifier";
}

function isImportDeclaration(
    node: null | TSESTree.Node | undefined
): node is TSESTree.ImportDeclaration {
    return node?.type === "ImportDeclaration";
}

function isImportDefaultSpecifier(
    node: null | TSESTree.Node | undefined
): node is TSESTree.ImportDefaultSpecifier {
    return node?.type === "ImportDefaultSpecifier";
}

function isImportNamespaceSpecifier(
    node: null | TSESTree.Node | undefined
): node is TSESTree.ImportNamespaceSpecifier {
    return node?.type === "ImportNamespaceSpecifier";
}

function isImportSpecifier(
    node: null | TSESTree.Node | undefined
): node is TSESTree.ImportSpecifier {
    return node?.type === "ImportSpecifier";
}

function isJSXClosingElement(
    node: null | TSESTree.Node | undefined
): node is TSESTree.JSXClosingElement {
    return node?.type === "JSXClosingElement";
}

function isJSXElement(
    node: null | TSESTree.Node | undefined
): node is TSESTree.JSXElement {
    return node?.type === "JSXElement";
}

function isJSXFragment(
    node: null | TSESTree.Node | undefined
): node is TSESTree.JSXFragment {
    return node?.type === "JSXFragment";
}

function isLogicalExpression(
    node: null | TSESTree.Node | undefined
): node is TSESTree.LogicalExpression {
    return node?.type === "LogicalExpression";
}

function isMemberExpression(
    node: null | TSESTree.Node | undefined
): node is TSESTree.MemberExpression {
    return node?.type === "MemberExpression";
}

function isMethodDefinition(
    node: null | TSESTree.Node | undefined
): node is TSESTree.MethodDefinition {
    return node?.type === "MethodDefinition";
}

function isObjectPattern(
    node: null | TSESTree.Node | undefined
): node is TSESTree.ObjectPattern {
    return node?.type === "ObjectPattern";
}

function isProgram(
    node: null | TSESTree.Node | undefined
): node is TSESTree.Program {
    return node?.type === "Program";
}

function isProperty(
    node: null | TSESTree.Node | undefined
): node is TSESTree.Property {
    return node?.type === "Property";
}

function isRestElement(
    node: null | TSESTree.Node | undefined
): node is TSESTree.RestElement {
    return node?.type === "RestElement";
}

function isReturnStatement(
    node: null | TSESTree.Node | undefined
): node is TSESTree.ReturnStatement {
    return node?.type === "ReturnStatement";
}

function isTSAbstractMethodDefinition(
    node: null | TSESTree.Node | undefined
): node is TSESTree.TSAbstractMethodDefinition {
    return node?.type === "TSAbstractMethodDefinition";
}

function isTSAsExpression(
    node: null | TSESTree.Node | undefined
): node is TSESTree.TSAsExpression {
    return node?.type === "TSAsExpression";
}

function isTSMethodSignature(
    node: null | TSESTree.Node | undefined
): node is TSESTree.TSMethodSignature {
    return node?.type === "TSMethodSignature";
}

function isTSModuleBlock(
    node: null | TSESTree.Node | undefined
): node is TSESTree.TSModuleBlock {
    return node?.type === "TSModuleBlock";
}

function isTSNonNullExpression(
    node: null | TSESTree.Node | undefined
): node is TSESTree.TSNonNullExpression {
    return node?.type === "TSNonNullExpression";
}

function isTSQualifiedName(
    node: null | TSESTree.Node | undefined
): node is TSESTree.TSQualifiedName {
    return node?.type === "TSQualifiedName";
}

function isTSSatisfiesExpression(
    node: null | TSESTree.Node | undefined
): node is TSESTree.TSSatisfiesExpression {
    return node?.type === "TSSatisfiesExpression";
}

function isTSTypeLiteral(
    node: null | TSESTree.Node | undefined
): node is TSESTree.TSTypeLiteral {
    return node?.type === "TSTypeLiteral";
}

function isTSTypeReference(
    node: null | TSESTree.Node | undefined
): node is TSESTree.TSTypeReference {
    return node?.type === "TSTypeReference";
}

function isVariableDeclaration(
    node: null | TSESTree.Node | undefined
): node is TSESTree.VariableDeclaration {
    return node?.type === "VariableDeclaration";
}

function isVariableDeclarator(
    node: null | TSESTree.Node | undefined
): node is TSESTree.VariableDeclarator {
    return node?.type === "VariableDeclarator";
}

export {
    isArrayExpression,
    isArrayPattern,
    isAssignmentPattern,
    isBlockStatement,
    isCallExpression,
    isConditionalExpression,
    isExportDefaultDeclaration,
    isExportNamedDeclaration,
    isExpressionStatement,
    isIdentifier,
    isImportDeclaration,
    isImportDefaultSpecifier,
    isImportNamespaceSpecifier,
    isImportSpecifier,
    isJSXClosingElement,
    isJSXElement,
    isJSXFragment,
    isLogicalExpression,
    isMemberExpression,
    isMethodDefinition,
    isObjectPattern,
    isProgram,
    isProperty,
    isRestElement,
    isReturnStatement,
    isTSAbstractMethodDefinition,
    isTSAsExpression,
    isTSMethodSignature,
    isTSModuleBlock,
    isTSNonNullExpression,
    isTSQualifiedName,
    isTSSatisfiesExpression,
    isTSTypeLiteral,
    isTSTypeReference,
    isVariableDeclaration,
    isVariableDeclarator,
};
