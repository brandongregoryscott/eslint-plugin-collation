import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type {
    RuleFix,
    RuleFixer,
    SourceCode,
} from "@typescript-eslint/utils/ts-eslint";
import upperFirst from "lodash/upperFirst";
import { RuleName } from "../enums/rule-name";
import { createRule } from "../utils/rule-utils";
import { first } from "../utils/collection-utils";

interface NoInlineObjectTypeOptions {
    /**
     * Pattern for the generated type name for inline parameter types.
     * Supports `{{functionName}}`, `{{upperFirstFunctionName}}`, `{{paramName}}`, and `{{upperFirstParamName}}` placeholders.
     * @default "{{upperFirstFunctionName}}{{upperFirstParamName}}"
     */
    parameterTypeNamePattern?: string;
    /**
     * Pattern for the generated type name for inline return types.
     * Supports `{{functionName}}` and `{{upperFirstFunctionName}}` placeholders.
     * @default "{{upperFirstFunctionName}}Result"
     */
    returnTypeNamePattern?: string;
}

type MessageIds = "noInlineObjectType";

const DEFAULT_PARAMETER_TYPE_NAME_PATTERN =
    "{{upperFirstFunctionName}}{{upperFirstParamName}}";
const DEFAULT_RETURN_TYPE_NAME_PATTERN = "{{upperFirstFunctionName}}Result";

const noInlineObjectType = createRule<[NoInlineObjectTypeOptions], MessageIds>({
    create: (context) => {
        const options = first(context.options) ?? {};
        const parameterTypeNamePattern =
            options.parameterTypeNamePattern ??
            DEFAULT_PARAMETER_TYPE_NAME_PATTERN;
        const returnTypeNamePattern =
            options.returnTypeNamePattern ?? DEFAULT_RETURN_TYPE_NAME_PATTERN;

        const reportInlineObjectType = (
            node: TSESTree.Node,
            typeLiteral: TSESTree.TSTypeLiteral,
            functionName: string,
            paramName: string | undefined
        ): void => {
            const sourceCode = context.sourceCode;
            const isReturnType = paramName == null;
            const pattern = isReturnType
                ? returnTypeNamePattern
                : parameterTypeNamePattern;
            const typeName = resolveTypeName(pattern, functionName, paramName);

            context.report({
                node: typeLiteral,
                messageId: "noInlineObjectType",
                fix: (fixer) =>
                    fixInlineObjectType(
                        fixer,
                        sourceCode,
                        node,
                        typeLiteral,
                        typeName
                    ),
            });
        };

        const checkParameters = (
            node: TSESTree.Node,
            params: TSESTree.Parameter[],
            functionName: string
        ): void => {
            const names = new Set(params.map(getParameterName));
            // Reserve fallback names even after extraction, keeping later autofix passes stable.
            for (const param of params) {
                let paramName = getParameterName(param);
                if (paramName == null) {
                    paramName = "params";
                    let suffix = 1;
                    while (names.has(paramName)) {
                        paramName = `params${++suffix}`;
                    }
                    names.add(paramName);
                }
                const typeLiteral = getInlineObjectType(param);
                if (typeLiteral != null) {
                    reportInlineObjectType(
                        node,
                        typeLiteral,
                        functionName,
                        paramName
                    );
                }
            }
        };

        const checkFunction = (
            node:
                | TSESTree.FunctionDeclaration
                | TSESTree.FunctionExpression
                | TSESTree.ArrowFunctionExpression
                | TSESTree.TSDeclareFunction
        ): void => {
            const functionName = getFunctionName(node);
            if (functionName == null) {
                return;
            }

            checkParameters(node, node.params, functionName);

            // Check return type for inline object type
            const returnTypeLiteral = getReturnTypeInlineObject(node);
            if (returnTypeLiteral != null) {
                reportInlineObjectType(
                    node,
                    returnTypeLiteral,
                    functionName,
                    undefined
                );
            }
        };

        const checkMethod = (
            node: TSESTree.MethodDefinition | TSESTree.TSMethodSignature
        ): void => {
            const methodName = getMethodName(node);
            if (methodName == null) {
                return;
            }

            if (node.type === AST_NODE_TYPES.MethodDefinition) {
                // MethodDefinition wraps a FunctionExpression
                const functionExpr = node.value;

                checkParameters(node, functionExpr.params, methodName);

                // Check return type
                const returnTypeLiteral =
                    getReturnTypeInlineObject(functionExpr);
                if (returnTypeLiteral != null) {
                    reportInlineObjectType(
                        node,
                        returnTypeLiteral,
                        methodName,
                        undefined
                    );
                }
            } else {
                // TSMethodSignature
                checkParameters(node, node.params, methodName);

                // Check return type
                if (
                    node.returnType?.typeAnnotation.type ===
                    AST_NODE_TYPES.TSTypeLiteral
                ) {
                    reportInlineObjectType(
                        node,
                        node.returnType.typeAnnotation,
                        methodName,
                        undefined
                    );
                }
            }
        };

        return {
            FunctionDeclaration: checkFunction,
            FunctionExpression: checkFunction,
            ArrowFunctionExpression: checkFunction,
            TSDeclareFunction: checkFunction,
            MethodDefinition: checkMethod,
            TSMethodSignature: checkMethod,
        };
    },
    defaultOptions: [{}],
    meta: {
        docs: {
            description:
                "Enforces extracting inline object types from function parameters and return types into named type aliases",
        },
        fixable: "code",
        messages: {
            noInlineObjectType:
                "Expected inline object type to be extracted into a named type alias",
        },
        schema: [
            {
                type: "object",
                properties: {
                    parameterTypeNamePattern: {
                        type: "string",
                        description:
                            "Pattern for the generated type name for inline parameter types. Supports {{functionName}}, {{upperFirstFunctionName}}, {{paramName}}, and {{upperFirstParamName}} placeholders.",
                    },
                    returnTypeNamePattern: {
                        type: "string",
                        description:
                            "Pattern for the generated type name for inline return types. Supports {{functionName}} and {{upperFirstFunctionName}} placeholders.",
                    },
                },
                additionalProperties: false,
            },
        ],
        type: "suggestion",
    },
    name: RuleName.NoInlineObjectType,
});

const getFunctionName = (
    node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression
        | TSESTree.TSDeclareFunction
): string | undefined => {
    // Named function declaration
    if (
        (node.type === AST_NODE_TYPES.FunctionDeclaration ||
            node.type === AST_NODE_TYPES.TSDeclareFunction) &&
        node.id != null
    ) {
        return node.id.name;
    }

    // Named function expression
    if (node.type === AST_NODE_TYPES.FunctionExpression && node.id != null) {
        return node.id.name;
    }

    // Arrow function or anonymous function assigned to a variable
    const { parent } = node;
    if (parent?.type === AST_NODE_TYPES.VariableDeclarator) {
        if (parent.id.type === AST_NODE_TYPES.Identifier) {
            return parent.id.name;
        }
    }

    // Function assigned to a property
    if (parent?.type === AST_NODE_TYPES.Property) {
        if (parent.key.type === AST_NODE_TYPES.Identifier) {
            return parent.key.name;
        }
    }

    return undefined;
};

const getMethodName = (
    node: TSESTree.MethodDefinition | TSESTree.TSMethodSignature
): string | undefined => {
    if (node.key.type === AST_NODE_TYPES.Identifier) {
        return node.key.name;
    }
    return undefined;
};

const getInlineObjectType = (
    param: TSESTree.Parameter
): TSESTree.TSTypeLiteral | undefined => {
    const parameter =
        param.type === AST_NODE_TYPES.AssignmentPattern ? param.left : param;
    if (
        (parameter.type === AST_NODE_TYPES.Identifier ||
            parameter.type === AST_NODE_TYPES.ObjectPattern ||
            parameter.type === AST_NODE_TYPES.RestElement) &&
        parameter.typeAnnotation?.typeAnnotation.type ===
            AST_NODE_TYPES.TSTypeLiteral
    ) {
        return parameter.typeAnnotation.typeAnnotation;
    }

    return undefined;
};

const getParameterName = (param: TSESTree.Parameter): string | undefined => {
    if (param.type === AST_NODE_TYPES.Identifier) {
        return param.name;
    }

    if (
        param.type === AST_NODE_TYPES.AssignmentPattern &&
        param.left.type === AST_NODE_TYPES.Identifier
    ) {
        return param.left.name;
    }

    if (
        param.type === AST_NODE_TYPES.RestElement &&
        param.argument.type === AST_NODE_TYPES.Identifier
    ) {
        return param.argument.name;
    }

    return undefined;
};

const getReturnTypeInlineObject = (
    node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression
        | TSESTree.TSDeclareFunction
        | TSESTree.TSEmptyBodyFunctionExpression
): TSESTree.TSTypeLiteral | undefined => {
    if (node.returnType?.typeAnnotation.type === AST_NODE_TYPES.TSTypeLiteral) {
        return node.returnType.typeAnnotation;
    }
    return undefined;
};

const resolveTypeName = (
    pattern: string,
    functionName: string,
    paramName?: string
): string => {
    let result = pattern
        .replace(/\{\{functionName\}\}/g, functionName)
        .replace(/\{\{upperFirstFunctionName\}\}/g, upperFirst(functionName));

    if (paramName != null) {
        result = result
            .replace(/\{\{paramName\}\}/g, paramName)
            .replace(/\{\{upperFirstParamName\}\}/g, upperFirst(paramName));
    }

    return result;
};

const fixInlineObjectType = (
    fixer: RuleFixer,
    sourceCode: SourceCode,
    functionNode: TSESTree.Node,
    typeLiteral: TSESTree.TSTypeLiteral,
    typeName: string
): RuleFix[] => {
    const typeText = sourceCode.getText(typeLiteral);

    // Find the statement that contains this function to insert the type before it
    const statementNode = getContainingStatement(functionNode);
    if (statementNode == null) {
        return [];
    }

    const typeDeclaration = `type ${typeName} = ${typeText};\n\n`;

    return [
        fixer.insertTextBefore(statementNode, typeDeclaration),
        fixer.replaceText(typeLiteral, typeName),
    ];
};

const getContainingStatement = (
    node: TSESTree.Node
): TSESTree.Statement | undefined => {
    let current: TSESTree.Node | undefined = node;

    while (current != null) {
        if (
            current.parent?.type === AST_NODE_TYPES.Program ||
            current.parent?.type === AST_NODE_TYPES.BlockStatement ||
            current.parent?.type === AST_NODE_TYPES.TSModuleBlock
        ) {
            return current as TSESTree.Statement;
        }
        current = current.parent;
    }

    return undefined;
};

export { noInlineObjectType };
