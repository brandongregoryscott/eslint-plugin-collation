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
import { ASTUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import type { SourceCode } from "@typescript-eslint/utils/ts-eslint";
import { descendants, functionName } from "./ast";
import type { FunctionNode } from "./ast";

class ReactComponentDetector {
    readonly #source: SourceCode;

    constructor(source: SourceCode) {
        this.#source = source;
    }

    // Resolve imports through lexical scope, so aliases work and shadowed names
    // do not accidentally turn an ordinary callback into a component.
    #reactName(node: TSESTree.Identifier, exported: string): boolean {
        const variable = ASTUtils.findVariable(
            this.#source.getScope(node),
            node.name
        );

        if (variable == null) {
            return exported === "*" && node.name === "React";
        }

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

    #reactMember(node: TSESTree.Node, names: string[]): boolean {
        if (isIdentifier(node)) {
            return names.some((name) => this.#reactName(node, name));
        }

        if (
            isMemberExpression(node) &&
            !node.computed &&
            isIdentifier(node.object) &&
            isIdentifier(node.property)
        ) {
            return (
                names.includes(node.property.name) &&
                this.#reactName(node.object, "*")
            );
        }

        if (isTSQualifiedName(node) && isIdentifier(node.left)) {
            return (
                names.includes(node.right.name) &&
                this.#reactName(node.left, "*")
            );
        }

        return false;
    }

    #componentType(node: TSESTree.Node | undefined): boolean {
        return (
            isTSTypeReference(node) &&
            this.#reactMember(node.typeName, ["FC", "FunctionComponent"])
        );
    }

    #returnsJSX(node: TSESTree.Node): boolean {
        if (isJSXElement(node) || isJSXFragment(node)) {
            return true;
        }

        if (isConditionalExpression(node)) {
            return (
                this.#returnsJSX(node.consequent) ||
                this.#returnsJSX(node.alternate)
            );
        }

        if (isLogicalExpression(node)) {
            return this.#returnsJSX(node.left) || this.#returnsJSX(node.right);
        }

        if (
            isTSAsExpression(node) ||
            isTSSatisfiesExpression(node) ||
            isTSNonNullExpression(node)
        ) {
            return this.#returnsJSX(node.expression);
        }

        return false;
    }

    isComponent(node: FunctionNode): boolean {
        if (!("body" in node) || node.body == null) {
            return false;
        }

        let current: TSESTree.Node = node;

        while (
            isTSAsExpression(current.parent) ||
            isTSSatisfiesExpression(current.parent)
        ) {
            current = current.parent;

            if (this.#componentType(current.typeAnnotation)) {
                return true;
            }
        }

        const parent = current.parent;

        if (
            isCallExpression(parent) &&
            parent.arguments[0] === current &&
            this.#reactMember(parent.callee, ["memo", "forwardRef"])
        ) {
            return true;
        }

        if (
            isVariableDeclarator(parent) &&
            isIdentifier(parent.id) &&
            this.#componentType(parent.id.typeAnnotation?.typeAnnotation)
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
            return this.#returnsJSX(node.body);
        }

        for (const child of descendants(node.body, this.#source, true)) {
            if (
                isReturnStatement(child) &&
                child.argument != null &&
                this.#returnsJSX(child.argument)
            ) {
                return true;
            }
        }

        return false;
    }
}

export { ReactComponentDetector };
