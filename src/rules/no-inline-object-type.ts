import type { TSESTree } from "@typescript-eslint/utils";
import upperFirst from "lodash/upperFirst";
import type { FunctionNode } from "../utils/ast";
import { RuleName } from "../enums/rule-name";
import {
    descendants,
    freshName,
    functionName,
    statementContainer,
} from "../utils/ast";
import {
    isAssignmentPattern,
    isIdentifier,
    isTSTypeLiteral,
} from "../utils/node-utils";
import { createRule } from "../utils/rule-utils";

type Options = {
    parameterTypeNamePattern?: string;
    returnTypeNamePattern?: string;
};

const noInlineObjectType = createRule<[Options], "noInlineObjectType">({
    create(context, [options]) {
        const source = context.sourceCode;

        function check(node: FunctionNode) {
            const name = functionName(node);

            if (name == null) {
                return;
            }

            const used = new Set<string>();

            for (const child of descendants(source.ast, source)) {
                if (isIdentifier(child)) {
                    used.add(child.name);
                }
            }

            const parameterNames = new Set(
                node.params.flatMap((param) => {
                    const left = isAssignmentPattern(param)
                        ? param.left
                        : param;

                    return isIdentifier(left) ? [left.name] : [];
                })
            );

            const extract = (
                annotation: TSESTree.TSTypeAnnotation | undefined,
                paramName?: string
            ) => {
                if (!isTSTypeLiteral(annotation?.typeAnnotation)) {
                    return;
                }

                const pattern =
                    paramName == null
                        ? options.returnTypeNamePattern ??
                          "{{upperFirstFunctionName}}Result"
                        : options.parameterTypeNamePattern ??
                          "{{upperFirstFunctionName}}{{upperFirstParamName}}";

                const values: Record<string, string> = {
                    functionName: name,
                    paramName: paramName ?? "",
                    upperFirstFunctionName: upperFirst(name),
                    upperFirstParamName:
                        paramName == null ? "" : upperFirst(paramName),
                };

                const base = pattern.replace(
                    /{{(\w+)}}/g,
                    (match, key: string) => values[key] ?? match
                );

                const typeName = freshName(base, used);
                const target = statementContainer(node);

                context.report({
                    fix: (fixer) => [
                        fixer.insertTextBefore(
                            target,
                            `type ${typeName} = ${source.getText(
                                annotation.typeAnnotation
                            )};\n\n`
                        ),
                        fixer.replaceText(annotation.typeAnnotation, typeName),
                    ],
                    messageId: "noInlineObjectType",
                    node: annotation.typeAnnotation,
                });
            };

            for (const param of node.params) {
                const left = isAssignmentPattern(param) ? param.left : param;

                const paramName = isIdentifier(left)
                    ? left.name
                    : freshName("params", parameterNames);

                extract(
                    "typeAnnotation" in left ? left.typeAnnotation : undefined,
                    paramName
                );
            }

            extract(node.returnType);
        }

        return {
            ArrowFunctionExpression: check,
            FunctionDeclaration: check,
            FunctionExpression: check,
            TSDeclareFunction: check,
            TSEmptyBodyFunctionExpression: check,
            TSMethodSignature: check,
        };
    },
    defaultOptions: [{}],
    meta: {
        docs: { description: "Name object types used in function signatures." },
        fixable: "code",
        messages: {
            noInlineObjectType: "Extract this object type to a named type.",
        },
        schema: [
            {
                additionalProperties: false,
                properties: {
                    parameterTypeNamePattern: {
                        description:
                            "Pattern for the generated type name for inline parameter types. Supports {{functionName}}, {{upperFirstFunctionName}}, {{paramName}}, and {{upperFirstParamName}} placeholders.",
                        type: "string",
                    },
                    returnTypeNamePattern: {
                        description:
                            "Pattern for the generated type name for inline return types. Supports {{functionName}} and {{upperFirstFunctionName}} placeholders.",
                        type: "string",
                    },
                },
                type: "object",
            },
        ],
        type: "suggestion",
    },
    name: RuleName.NoInlineObjectType,
});

export { noInlineObjectType };
