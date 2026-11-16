import { isEmpty } from "lodash";
import {
    isExportNamedDeclaration,
    isIdentifier,
    isVariableDeclarator,
} from "../utils/node-utils";
import { createRule } from "../utils/create-rule";
import { declarationNames } from "../utils/ast";

const noDefaultExport = createRule({
    name: "no-default-export",
    meta: {
        type: "suggestion",
        docs: { description: "Prefer named exports." },
        fixable: "code",
        schema: [],
        messages: { noDefaultExport: "Use a named export." },
    },
    defaultOptions: [],
    create(context) {
        const source = context.sourceCode;

        return {
            ExportDefaultDeclaration(node) {
                context.report({
                    node,
                    messageId: "noDefaultExport",
                    fix(fixer) {
                        const declaration = node.declaration;

                        if (isIdentifier(declaration)) {
                            const scope = source.getScope(node);
                            const variable = scope.set.get(declaration.name);
                            const definition = variable?.defs[0];
                            if (definition == null) {
                                return null;
                            }

                            let target = definition.node;
                            if (isVariableDeclarator(target)) {
                                target = target.parent;
                            }

                            if (isExportNamedDeclaration(target.parent)) {
                                return null;
                            }

                            const comments = source
                                .getCommentsInside(node)
                                .filter(
                                    (comment) =>
                                        comment.range[1] <= declaration.range[0]
                                );

                            const prefix = comments
                                .map(
                                    (comment) =>
                                        `${source.getText(comment)}${
                                            comment.type === "Line" ? "\n" : " "
                                        }`
                                )
                                .join("");

                            return [
                                fixer.insertTextBefore(
                                    target,
                                    `${prefix}export `
                                ),
                                fixer.remove(node),
                            ];
                        }

                        if (isEmpty(declarationNames(declaration))) {
                            return null;
                        }

                        const keyword = source
                            .getTokens(node)
                            .find((token) => token.value === "default");
                        if (keyword == null) {
                            return null;
                        }

                        return fixer.removeRange([
                            keyword.range[0],
                            keyword.range[1] +
                                (source.text[keyword.range[1]] === " " ? 1 : 0),
                        ]);
                    },
                });
            },
        };
    },
});

export { noDefaultExport };
