import type { TSESTree } from "@typescript-eslint/utils";
import type {
    RuleFix,
    RuleFixer,
    SourceCode,
} from "@typescript-eslint/utils/ts-eslint";
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

interface PropsFix {
    apply: (fixer: RuleFixer) => RuleFix[];
    automatic: boolean;
}

const collectNodes = (
    node: TSESTree.Node,
    sourceCode: SourceCode
): TSESTree.Node[] => {
    const nodes = [node];
    for (const key of sourceCode.visitorKeys[node.type] ?? []) {
        const child = (
            node as unknown as Record<
                string,
                TSESTree.Node | TSESTree.Node[] | null
            >
        )[key];
        if (Array.isArray(child)) {
            for (const item of child) {
                if (item != null) {
                    nodes.push(...collectNodes(item, sourceCode));
                }
            }
        } else if (child != null) {
            nodes.push(...collectNodes(child, sourceCode));
        }
    }
    return nodes;
};

const createPropsFix = (
    sourceCode: SourceCode,
    node: ComponentFunction,
    pattern: TSESTree.ObjectPattern
): PropsFix | undefined => {
    const nodes = collectNodes(node, sourceCode);
    const identifiers = new Set(
        nodes
            .filter(
                (child): child is TSESTree.Identifier =>
                    child.type === AST_NODE_TYPES.Identifier
            )
            .map((child) => child.name)
    );
    // Dynamic scope, arguments mapping, and generators need a manual rewrite.
    if (
        identifiers.has("eval") ||
        identifiers.has("arguments") ||
        node.generator === true ||
        node.async ||
        pattern.optional
    ) {
        return undefined;
    }
    const bindings = sourceCode
        .getDeclaredVariables(node)
        .filter((variable) =>
            variable.defs.some(
                (definition) =>
                    definition.type === "Parameter" &&
                    definition.name.range[0] >= pattern.range[0] &&
                    definition.name.range[1] <= pattern.range[1]
            )
        );
    if (
        bindings.some((variable) =>
            variable.defs.some((definition) => definition.type !== "Parameter")
        )
    ) {
        return undefined;
    }
    const names = new Set(bindings.map((variable) => variable.name));
    // Moving these bindings into the body would break a later parameter initializer.
    const laterParameters = node.params.slice(1);
    if (
        laterParameters.some((parameter) =>
            collectNodes(parameter, sourceCode).some(
                (child) =>
                    child.type === AST_NODE_TYPES.Identifier &&
                    names.has(child.name)
            )
        )
    ) {
        return undefined;
    }
    let propsName = "props";
    let suffix = 2;
    while (identifiers.has(propsName)) {
        propsName = `props${suffix++}`;
    }
    const annotation = pattern.typeAnnotation;
    const patternText = sourceCode.text.slice(
        pattern.range[0],
        annotation?.range[0] ?? pattern.range[1]
    );
    const typeText = annotation == null ? "" : sourceCode.getText(annotation);
    const keyword = bindings.some((variable) =>
        variable.references.some(
            (reference) => reference.isWrite() && reference.init !== true
        )
    )
        ? "let"
        : "const";
    const declaration = `${keyword} ${patternText} = ${propsName};`;
    const hasExpressions = collectNodes(pattern, sourceCode).some(
        (child) =>
            child.type === AST_NODE_TYPES.AssignmentPattern ||
            (child.type === AST_NODE_TYPES.Property && child.computed)
    );
    const automatic =
        node.params[0].type === AST_NODE_TYPES.ObjectPattern &&
        !hasExpressions &&
        laterParameters.every(
            (parameter) => parameter.type === AST_NODE_TYPES.Identifier
        );
    return {
        automatic,
        apply: (fixer) => {
            const fixes = [
                fixer.replaceText(pattern, `${propsName}${typeText}`),
            ];
            if (node.body.type === AST_NODE_TYPES.BlockStatement) {
                let insertionPoint = node.body.range[0] + 1;
                for (const statement of node.body.body) {
                    if (
                        statement.type !== AST_NODE_TYPES.ExpressionStatement ||
                        statement.directive == null
                    ) {
                        break;
                    }
                    insertionPoint = statement.range[1];
                }
                fixes.push(
                    fixer.insertTextAfterRange(
                        [insertionPoint, insertionPoint],
                        `\n${declaration}\n`
                    )
                );
            } else {
                const arrow = sourceCode.getTokenBefore(
                    node.body,
                    (token) => token.value === "=>"
                );
                if (arrow == null) {
                    return [];
                }
                const expression = sourceCode.text
                    .slice(arrow.range[1], node.range[1])
                    .trim();
                fixes.push(
                    fixer.replaceTextRange(
                        [arrow.range[1], node.range[1]],
                        ` {\n${declaration}\nreturn (\n${expression}\n);\n}`
                    )
                );
            }
            return fixes;
        },
    };
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
                const propsFix = createPropsFix(
                    context.sourceCode,
                    node,
                    pattern
                );
                context.report({
                    messageId: "destructureInBody",
                    node: pattern,
                    fix:
                        propsFix?.automatic === true
                            ? propsFix.apply
                            : undefined,
                    suggest:
                        propsFix != null && !propsFix.automatic
                            ? [
                                  {
                                      messageId: "reviewDestructureInBody",
                                      fix: propsFix.apply,
                                  },
                              ]
                            : undefined,
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
        fixable: "code",
        hasSuggestions: true,
        messages: {
            reviewDestructureInBody:
                "Move props destructuring into the body (review default evaluation and scope).",
            destructureInBody:
                "Accept a props parameter and destructure it inside the component body.",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.NoDestructuredPropsParameter,
});

export { noDestructuredPropsParameter };
