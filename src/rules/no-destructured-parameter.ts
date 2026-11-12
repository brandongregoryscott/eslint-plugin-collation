import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { RuleName } from "../enums/rule-name";
import { collectNodes, isIdentifier } from "../utils/node-utils";
import { insertFunctionBodyDeclarations } from "../utils/fixer-utils";
import { createRule } from "../utils/rule-utils";

type FunctionSignature =
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.TSCallSignatureDeclaration
    | TSESTree.TSConstructSignatureDeclaration
    | TSESTree.TSConstructorType
    | TSESTree.TSDeclareFunction
    | TSESTree.TSEmptyBodyFunctionExpression
    | TSESTree.TSFunctionType
    | TSESTree.TSMethodSignature;

type FunctionImplementation =
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression;

type BindingPattern = TSESTree.ArrayPattern | TSESTree.ObjectPattern;

const getBindingPattern = (
    parameter: TSESTree.Node
): BindingPattern | undefined => {
    switch (parameter.type) {
        case AST_NODE_TYPES.ArrayPattern:
        case AST_NODE_TYPES.ObjectPattern:
            return parameter;
        case AST_NODE_TYPES.AssignmentPattern:
            return getBindingPattern(parameter.left);
        case AST_NODE_TYPES.RestElement:
            return getBindingPattern(parameter.argument);
        case AST_NODE_TYPES.TSParameterProperty:
            return getBindingPattern(parameter.parameter);
        default:
            return undefined;
    }
};

const isImplementation = (
    node: FunctionSignature
): node is FunctionImplementation =>
    node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression;

const noDestructuredParameter = createRule({
    create: (context) => {
        const checkSignature = (node: FunctionSignature): void => {
            const patterns = node.params.flatMap((parameter) => {
                const pattern = getBindingPattern(parameter);
                return pattern == null ? [] : [pattern];
            });
            if (patterns.length === 0) {
                return;
            }

            const sourceCode = context.sourceCode;
            const nodes = collectNodes(node, sourceCode);
            const identifiers = new Set(
                nodes.filter(isIdentifier).map((child) => child.name)
            );
            // Moving parameter expressions can change evaluation order and scope.
            // Async/generator bodies also change when destructuring errors surface.
            const automatic =
                isImplementation(node) &&
                !node.async &&
                node.generator !== true &&
                !(
                    node.parent.type === AST_NODE_TYPES.MethodDefinition &&
                    node.parent.kind === "constructor"
                ) &&
                !identifiers.has("arguments") &&
                !identifiers.has("eval") &&
                !patterns.some((pattern) => pattern.optional) &&
                node.params.every((parameter) =>
                    collectNodes(parameter, sourceCode).every(
                        (child) =>
                            child.type !== AST_NODE_TYPES.AssignmentPattern &&
                            child.type !== AST_NODE_TYPES.TSParameterProperty &&
                            (child.type !== AST_NODE_TYPES.Property ||
                                !child.computed)
                    )
                );
            const variables = sourceCode.getDeclaredVariables(node);
            const bindings = patterns.map((pattern) =>
                variables.filter((variable) =>
                    variable.defs.some(
                        (definition) =>
                            definition.type === "Parameter" &&
                            definition.name.range[0] >= pattern.range[0] &&
                            definition.name.range[1] <= pattern.range[1]
                    )
                )
            );
            const redeclared = bindings.some((group) =>
                group.some((variable) =>
                    variable.defs.some(
                        (definition) => definition.type !== "Parameter"
                    )
                )
            );
            const canFix = automatic && !redeclared;
            const replacements = patterns.map((pattern, index) => {
                let name = "parameter";
                let suffix = 2;
                while (identifiers.has(name)) {
                    name = `parameter${suffix++}`;
                }
                identifiers.add(name);
                const annotation = pattern.typeAnnotation;
                const patternText = sourceCode.text.slice(
                    pattern.range[0],
                    annotation?.range[0] ?? pattern.range[1]
                );
                const typeText =
                    annotation == null ? "" : sourceCode.getText(annotation);
                const keyword = bindings[index].some((variable) =>
                    variable.references.some(
                        (reference) =>
                            reference.isWrite() && reference.init !== true
                    )
                )
                    ? "let"
                    : "const";
                return {
                    declaration: `${keyword} ${patternText} = ${name};`,
                    parameter: `${name}${typeText}`,
                    pattern,
                };
            });

            for (const [index, pattern] of patterns.entries()) {
                context.report({
                    messageId: "destructureInBody",
                    node: pattern,
                    // One atomic fix preserves the order of multiple patterns.
                    fix:
                        index === 0 && canFix && isImplementation(node)
                            ? (fixer) => {
                                  const bodyFixes =
                                      insertFunctionBodyDeclarations({
                                          declarations: replacements.map(
                                              (replacement) =>
                                                  replacement.declaration
                                          ),
                                          node,
                                          sourceCode,
                                      });
                                  if (bodyFixes == null) {
                                      return null;
                                  }
                                  return [
                                      ...replacements.map((replacement) =>
                                          fixer.replaceText(
                                              replacement.pattern,
                                              replacement.parameter
                                          )
                                      ),
                                      ...bodyFixes,
                                  ];
                              }
                            : undefined,
                });
            }
        };

        return {
            ArrowFunctionExpression: checkSignature,
            FunctionDeclaration: checkSignature,
            FunctionExpression: checkSignature,
            TSCallSignatureDeclaration: checkSignature,
            TSConstructSignatureDeclaration: checkSignature,
            TSConstructorType: checkSignature,
            TSDeclareFunction: checkSignature,
            TSEmptyBodyFunctionExpression: checkSignature,
            TSFunctionType: checkSignature,
            TSMethodSignature: checkSignature,
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "Require function and method parameters to be destructured inside the body",
        },
        fixable: "code",
        messages: {
            destructureInBody:
                "Accept a named parameter and move destructuring inside the function body.",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.NoDestructuredParameter,
});

export { noDestructuredParameter };
