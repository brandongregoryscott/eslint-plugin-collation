import { isEmpty } from "lodash";
import {
    isExportDefaultDeclaration,
    isIdentifier,
    isTSModuleBlock,
} from "../utils/node-utils";
import type { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/rule-utils";
import { declarationNames } from "../utils/ast";

const noInlineExport = createRule({
    name: "no-inline-export",
    meta: {
        type: "suggestion",
        docs: { description: "Separate declarations from exports." },
        fixable: "code",
        schema: [],
        messages: {
            noInlineExport: "Move this export after the declarations.",
        },
    },
    defaultOptions: [],
    create(context) {
        const source = context.sourceCode;

        function check(
            node:
                | TSESTree.ExportNamedDeclaration
                | TSESTree.ExportDefaultDeclaration
        ) {
            const declaration = node.declaration;
            if (declaration == null || isIdentifier(declaration)) {
                return;
            }

            const names = declarationNames(declaration);
            if (isEmpty(names)) {
                return;
            }

            context.report({
                node,
                messageId: "noInlineExport",
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

                    const parent = node.parent;

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
            });
        }

        return {
            ExportNamedDeclaration: check,
            ExportDefaultDeclaration: check,
        };
    },
});

export { noInlineExport };
