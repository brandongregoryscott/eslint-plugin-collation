import type { TSESTree } from "@typescript-eslint/utils";
import isEmpty from "lodash/isEmpty";
import { RuleName } from "../enums/rule-name";
import { declarationNames } from "../utils/ast";
import {
    isExportDefaultDeclaration,
    isIdentifier,
    isTSModuleBlock,
} from "../utils/node-utils";
import { createRule } from "../utils/rule-utils";

const noInlineExport = createRule({
    create(context) {
        const source = context.sourceCode;

        function check(
            node:
                | TSESTree.ExportDefaultDeclaration
                | TSESTree.ExportNamedDeclaration
        ) {
            const { declaration } = node;

            if (declaration == null || isIdentifier(declaration)) {
                return;
            }

            const names = declarationNames(declaration);

            if (isEmpty(names)) {
                return;
            }

            context.report({
                fix(fixer) {
                    const removals = source
                        .getTokens(node)
                        .filter(
                            (token) =>
                                token.range[1] <= declaration.range[0] &&
                                (token.value === "export" ||
                                    token.value === "default")
                        );

                    const fixes = removals.map((token) =>
                        fixer.removeRange([
                            token.range[0],
                            token.range[1] +
                                (source.text[token.range[1]] === " " ? 1 : 0),
                        ])
                    );

                    const text = isExportDefaultDeclaration(node)
                        ? `export default ${names[0]};`
                        : `export { ${names.join(", ")} };`;

                    const { parent } = node;

                    if (isTSModuleBlock(parent)) {
                        const last = parent.body[parent.body.length - 1];

                        fixes.push(fixer.insertTextAfter(last, `\n${text}`));

                        return fixes;
                    }

                    fixes.push(
                        fixer.insertTextAfterRange(
                            [source.text.length, source.text.length],
                            `\n${text}`
                        )
                    );

                    return fixes;
                },
                messageId: "noInlineExport",
                node,
            });
        }

        return {
            ExportDefaultDeclaration: check,
            ExportNamedDeclaration: check,
        };
    },
    defaultOptions: [],
    meta: {
        docs: { description: "Separate declarations from exports." },
        fixable: "code",
        messages: {
            noInlineExport: "Move this export after the declarations.",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.NoInlineExport,
});

export { noInlineExport };
