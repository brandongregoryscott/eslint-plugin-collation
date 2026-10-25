import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES, ASTUtils } from "@typescript-eslint/utils";
import { RuleName } from "../enums/rule-name";
import { createRule } from "../utils/rule-utils";

type ComponentFunction =
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression;

interface FunctionFrame {
    returnsJsx: boolean;
}

const returnsJsx = (node: TSESTree.Node | null): boolean => {
    if (node == null) {
        return false;
    }
    switch (node.type) {
        case AST_NODE_TYPES.JSXElement:
        case AST_NODE_TYPES.JSXFragment:
            return true;
        case AST_NODE_TYPES.ConditionalExpression:
            return returnsJsx(node.consequent) || returnsJsx(node.alternate);
        case AST_NODE_TYPES.LogicalExpression:
            return returnsJsx(node.left) || returnsJsx(node.right);
        case AST_NODE_TYPES.TSAsExpression:
        case AST_NODE_TYPES.TSNonNullExpression:
        case AST_NODE_TYPES.TSSatisfiesExpression:
        case AST_NODE_TYPES.TSTypeAssertion:
            return returnsJsx(node.expression);
        default:
            return false;
    }
};

const noDestructuredPropsParameter = createRule({
    create: (context) => {
        const frames: FunctionFrame[] = [];
        const isReactImport = (
            identifier: TSESTree.Identifier,
            names?: string[]
        ): boolean => {
            const variable = ASTUtils.findVariable(
                context.sourceCode.getScope(identifier),
                identifier.name
            );
            if (variable == null) {
                return names == null && identifier.name === "React";
            }
            return variable.defs.some((definition) => {
                if (
                    definition.type !== "ImportBinding" ||
                    definition.parent.type !==
                        AST_NODE_TYPES.ImportDeclaration ||
                    definition.parent.source.value !== "react"
                ) {
                    return false;
                }
                const specifier = definition.node;
                if (names == null) {
                    return specifier.type !== AST_NODE_TYPES.ImportSpecifier;
                }
                return (
                    specifier.type === AST_NODE_TYPES.ImportSpecifier &&
                    specifier.imported.type === AST_NODE_TYPES.Identifier &&
                    names.includes(specifier.imported.name)
                );
            });
        };

        const isWrapper = (node: TSESTree.Node): boolean => {
            if (node.type !== AST_NODE_TYPES.CallExpression) {
                return false;
            }
            const { callee } = node;
            if (callee.type === AST_NODE_TYPES.Identifier) {
                return isReactImport(callee, ["memo", "forwardRef"]);
            }
            return (
                callee.type === AST_NODE_TYPES.MemberExpression &&
                !callee.computed &&
                callee.object.type === AST_NODE_TYPES.Identifier &&
                isReactImport(callee.object) &&
                callee.property.type === AST_NODE_TYPES.Identifier &&
                ["memo", "forwardRef"].includes(callee.property.name)
            );
        };

        const isComponentType = (node: TSESTree.Node | undefined): boolean => {
            if (node?.type !== AST_NODE_TYPES.TSTypeReference) {
                return false;
            }
            const { typeName } = node;
            if (typeName.type === AST_NODE_TYPES.Identifier) {
                return isReactImport(typeName, ["FC", "FunctionComponent"]);
            }
            return (
                typeName.type === AST_NODE_TYPES.TSQualifiedName &&
                typeName.left.type === AST_NODE_TYPES.Identifier &&
                isReactImport(typeName.left) &&
                ["FC", "FunctionComponent"].includes(typeName.right.name)
            );
        };

        const enterFunction = (): void => {
            frames.push({ returnsJsx: false });
        };

        const exitFunction = (node: ComponentFunction): void => {
            const frame = frames.pop();
            const parameter = node.params[0];
            const pattern =
                parameter?.type === AST_NODE_TYPES.AssignmentPattern
                    ? parameter.left
                    : parameter;
            if (pattern?.type !== AST_NODE_TYPES.ObjectPattern) {
                return;
            }

            let expression: TSESTree.Node = node;
            let parent = node.parent;
            while (
                parent.type === AST_NODE_TYPES.TSAsExpression ||
                parent.type === AST_NODE_TYPES.TSSatisfiesExpression
            ) {
                expression = parent;
                parent = parent.parent;
            }
            const wrapped =
                isWrapper(parent) &&
                parent.type === AST_NODE_TYPES.CallExpression &&
                parent.arguments[0] === expression;
            const declaration =
                parent.type === AST_NODE_TYPES.VariableDeclarator
                    ? parent
                    : undefined;
            let name: string | undefined;
            if (
                node.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
                node.id != null
            ) {
                name = node.id.name;
            } else if (declaration?.id.type === AST_NODE_TYPES.Identifier) {
                name = declaration.id.name;
            }
            const typed = isComponentType(
                declaration?.id.typeAnnotation?.typeAnnotation
            );
            const named = name != null && /^[A-Z]/.test(name);
            const defaultExport =
                parent.type === AST_NODE_TYPES.ExportDefaultDeclaration;
            const jsx = frame?.returnsJsx === true || returnsJsx(node.body);

            if (wrapped || typed || (jsx && (named || defaultExport))) {
                context.report({
                    messageId: "destructureInBody",
                    node: pattern,
                });
            }
        };

        return {
            ArrowFunctionExpression: enterFunction,
            "ArrowFunctionExpression:exit": exitFunction,
            FunctionDeclaration: enterFunction,
            "FunctionDeclaration:exit": exitFunction,
            FunctionExpression: enterFunction,
            "FunctionExpression:exit": exitFunction,
            ReturnStatement: (node): void => {
                const frame = frames[frames.length - 1];
                if (frame != null && returnsJsx(node.argument)) {
                    frame.returnsJsx = true;
                }
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "Require component props to be destructured inside the function body instead of its parameters",
        },
        messages: {
            destructureInBody:
                "Accept a props parameter and destructure it inside the component body.",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.NoDestructuredPropsParameter,
});

export { noDestructuredPropsParameter };
