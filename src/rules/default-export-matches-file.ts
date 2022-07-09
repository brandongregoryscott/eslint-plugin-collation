import type { TSESTree } from "@typescript-eslint/types";
import { RuleName } from "../enums/rule-name";
import { getName } from "../utils/node-utils";
import { createRule } from "../utils/rule-utils";
import { getBaseFilename } from "../utils/string-utils";
import camelCase from "lodash/camelCase";
import isEmpty from "lodash/isEmpty";

const defaultExportMatchesFile = createRule({
    create: (context) => {
        const filename = getBaseFilename(context.getFilename());

        return {
            ExportDefaultDeclaration: (
                node: TSESTree.ExportDefaultDeclaration
            ): void => {
                const name = getName(node.declaration);
                if (isEmpty(name)) {
                    return;
                }

                const expectedName = camelCase(filename);
                if (name === expectedName) {
                    return;
                }

                const sourceCode = context.getSourceCode();
                const updatedText = sourceCode
                    .getText(node)
                    .replace(name!, expectedName);

                context.report({
                    node,
                    messageId: "defaultExportMatchesFile",
                    fix: (fixer) => fixer.replaceText(node, updatedText),
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description: "Ensures default export matches the file name",
            recommended: "warn",
        },
        fixable: "code",
        messages: {
            defaultExportMatchesFile:
                "Expected default export name to match file name",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.DefaultExportMatchesFile,
});

export { defaultExportMatchesFile };
