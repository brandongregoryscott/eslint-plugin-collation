import { RuleName } from "../enums/rule-name";
import { upperFirst } from "lodash";
import {
    isAssignmentPattern,
    isIdentifier,
    isTSTypeLiteral,
} from "../utils/node-utils";
import type { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/rule-utils";
import {
    descendants,
    freshName,
    functionName,
    statementContainer,
} from "../utils/ast";
import type { FunctionNode } from "../utils/ast";

interface Options {
    parameterTypeNamePattern?: string;
    returnTypeNamePattern?: string;
}

const noInlineObjectType = createRule<[Options], "noInlineObjectType">({
    name: RuleName.NoInlineObjectType,
    meta: {
        type: "suggestion",
        docs: { description: "Name object types used in function signatures." },
        fixable: "code",
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
        messages: {
            noInlineObjectType: "Extract this object type to a named type.",
        },
    },
    defaultOptions: [{}],
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

            function extract(
                annotation: TSESTree.TSTypeAnnotation | undefined,
                paramName?: string
            ) {
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
                    functionName: name as string,
                    upperFirstFunctionName: upperFirst(name as string),
                    paramName: paramName ?? "",
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
                    node: annotation.typeAnnotation,
                    messageId: "noInlineObjectType",
                    fix: (fixer) => [
                        fixer.insertTextBefore(
                            target,
                            `type ${typeName} = ${source.getText(
                                annotation.typeAnnotation
                            )};\n\n`
                        ),
                        fixer.replaceText(annotation.typeAnnotation, typeName),
                    ],
                });
            }

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
            FunctionDeclaration: check,
            FunctionExpression: check,
            ArrowFunctionExpression: check,
            TSDeclareFunction: check,
            TSMethodSignature: check,
            TSEmptyBodyFunctionExpression: check,
        };
    },
});

export { noInlineObjectType };
