import {
    isBlockStatement,
    isCallExpression,
    isConditionalExpression,
    isExportDefaultDeclaration,
    isIdentifier,
    isImportDeclaration,
    isImportDefaultSpecifier,
    isImportNamespaceSpecifier,
    isImportSpecifier,
    isJSXElement,
    isJSXFragment,
    isLogicalExpression,
    isMemberExpression,
    isMethodDefinition,
    isProperty,
    isReturnStatement,
    isTSAsExpression,
    isTSNonNullExpression,
    isTSQualifiedName,
    isTSSatisfiesExpression,
    isTSTypeReference,
    isVariableDeclarator,
} from "./node-utils";
import type { TSESTree } from "@typescript-eslint/utils";
import type { SourceCode } from "@typescript-eslint/utils/ts-eslint";
import { descendants, functionName } from "./ast";
import type { FunctionNode } from "./ast";

function reactComponents(source: SourceCode) {
    // Resolve imports through lexical scope, so aliases work and shadowed names
    // do not accidentally turn an ordinary callback into a component.
    function reactName(node: TSESTree.Identifier, exported: string): boolean {
        let scope = source.getScope(node);

        while (true) {
            const variable = scope.set.get(node.name);

            if (variable !== undefined) {
                const definition = variable.defs[0];

                if (
                    definition?.type !== "ImportBinding" ||
                    (isImportDeclaration(definition.parent)
                        ? definition.parent.source.value
                        : undefined) !== "react"
                ) {
                    return false;
                }

                const specifier = definition.node;

                if (exported === "*") {
                    return (
                        isImportDefaultSpecifier(specifier) ||
                        isImportNamespaceSpecifier(specifier)
                    );
                }

                return (
                    isImportSpecifier(specifier) &&
                    (isIdentifier(specifier.imported)
                        ? specifier.imported.name
                        : specifier.imported.value) === exported
                );
            }

            if (scope.upper == null) {
                break;
            }

            scope = scope.upper;
        }

        return exported === "*" && node.name === "React";
    }

    function reactMember(node: TSESTree.Node, names: string[]): boolean {
        if (isIdentifier(node)) {
            return names.some((name) => reactName(node, name));
        }

        if (
            isMemberExpression(node) &&
            !node.computed &&
            isIdentifier(node.object) &&
            isIdentifier(node.property)
        ) {
            return (
                names.includes(node.property.name) &&
                reactName(node.object, "*")
            );
        }

        if (isTSQualifiedName(node) && isIdentifier(node.left)) {
            return names.includes(node.right.name) && reactName(node.left, "*");
        }

        return false;
    }

    function componentType(node: TSESTree.Node | undefined): boolean {
        return (
            isTSTypeReference(node) &&
            reactMember(node.typeName, ["FC", "FunctionComponent"])
        );
    }

    function returnsJSX(node: TSESTree.Node): boolean {
        if (isJSXElement(node) || isJSXFragment(node)) {
            return true;
        }

        if (isConditionalExpression(node)) {
            return returnsJSX(node.consequent) || returnsJSX(node.alternate);
        }

        if (isLogicalExpression(node)) {
            return returnsJSX(node.left) || returnsJSX(node.right);
        }

        if (
            isTSAsExpression(node) ||
            isTSSatisfiesExpression(node) ||
            isTSNonNullExpression(node)
        ) {
            return returnsJSX(node.expression);
        }

        return false;
    }

    function isComponent(node: FunctionNode): boolean {
        if (!("body" in node) || node.body == null) {
            return false;
        }

        let current: TSESTree.Node = node;

        while (
            isTSAsExpression(current.parent) ||
            isTSSatisfiesExpression(current.parent)
        ) {
            current = current.parent;

            if (componentType(current.typeAnnotation)) {
                return true;
            }
        }

        const parent = current.parent;

        if (
            isCallExpression(parent) &&
            parent.arguments[0] === current &&
            reactMember(parent.callee, ["memo", "forwardRef"])
        ) {
            return true;
        }

        if (
            isVariableDeclarator(parent) &&
            isIdentifier(parent.id) &&
            componentType(parent.id.typeAnnotation?.typeAnnotation)
        ) {
            return true;
        }

        const name = functionName(node);
        const named = name !== undefined && /^[A-Z]/.test(name);
        const defaultExport = isExportDefaultDeclaration(parent);

        if (!named && !defaultExport) {
            return false;
        }

        if (isMethodDefinition(node.parent) || isProperty(node.parent)) {
            return false;
        }

        if (!isBlockStatement(node.body)) {
            return returnsJSX(node.body);
        }

        for (const child of descendants(node.body, source, true)) {
            if (
                isReturnStatement(child) &&
                child.argument != null &&
                returnsJSX(child.argument)
            ) {
                return true;
            }
        }

        return false;
    }

    return { isComponent };
}

export { reactComponents };
