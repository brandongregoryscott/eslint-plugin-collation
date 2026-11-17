import isEmpty from "lodash/isEmpty";
import { RuleName } from "../enums/rule-name";
import { declarationNames } from "../utils/ast";
import { stringifyComments } from "../utils/node-comment-utils";
import {
    isExportNamedDeclaration,
    isIdentifier,
    isVariableDeclarator,
} from "../utils/node-utils";
import { createRule } from "../utils/rule-utils";

const noDefaultExport = createRule({
    create(context) {
        const source = context.sourceCode;

        return {
            ExportDefaultDeclaration(node) {
                context.report({
                    fix(fixer) {
                        const { declaration } = node;

                        if (isIdentifier(declaration)) {
                            const scope = source.getScope(node);
                            const variable = scope.set.get(declaration.name);
                            const definition = variable?.defs[0];

                            if (
                                definition == null ||
                                definition.type === "ImportBinding"
                            ) {
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

                            const prefix = stringifyComments(comments, source);

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
                    messageId: "noDefaultExport",
                    node,
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: { description: "Prefer named exports." },
        fixable: "code",
        messages: { noDefaultExport: "Use a named export." },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.NoDefaultExport,
});

export { noDefaultExport };
