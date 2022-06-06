import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import {
    RuleFix,
    RuleFixer,
    SourceCode,
} from "@typescript-eslint/utils/dist/ts-eslint";
import { RuleName } from "../enums/rule-name";
import { last } from "../utils/core-utils";
import { getName } from "../utils/node-utils";
import { createRule } from "../utils/rule-utils";

const noInlineExport = createRule({
    create: (context) => {
        return {
            ExportDefaultDeclaration: (defaultExport) => {
                const sourceCode = context.getSourceCode();
                if (!isInlineDefaultExport(defaultExport, sourceCode)) {
                    return;
                }

                context.report({
                    node: defaultExport,
                    messageId: "noInlineExport",
                    fix: (fixer) =>
                        fixInlineExport(fixer, defaultExport, sourceCode),
                });
            },
            ExportNamedDeclaration: (namedExport) => {
                // The presence of `ExportSpecifiers` means it is a separate export statement
                if (hasSpecifiers(namedExport)) {
                    return;
                }

                const sourceCode = context.getSourceCode();

                context.report({
                    node: namedExport,
                    messageId: "noInlineExport",
                    fix: (fixer) =>
                        fixInlineExport(fixer, namedExport, sourceCode),
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description: "Enforces exports to appear at the end of the file",
            recommended: "warn",
        },
        fixable: "code",
        messages: {
            noInlineExport: "Expected export to appear at end of file",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.NoInlineExport,
});

const fixInlineExport = (
    fixer: RuleFixer,
    exportDeclaration:
        | TSESTree.ExportNamedDeclaration
        | TSESTree.ExportDefaultDeclaration,
    sourceCode: SourceCode
): RuleFix | RuleFix[] => {
    const { declaration } = exportDeclaration;
    const isDefault =
        exportDeclaration.type === AST_NODE_TYPES.ExportDefaultDeclaration;
    const lastStatement = last(sourceCode.ast.body);
    const name = getName(declaration);

    if (lastStatement == null || declaration == null || name == null) {
        return [];
    }

    const exportStatement = isDefault
        ? `\nexport default ${name};`
        : `\nexport { ${name} };`;

    return [
        fixer.insertTextAfter(
            exportDeclaration,
            sourceCode.getText(declaration)
        ),
        fixer.remove(exportDeclaration),
        fixer.insertTextAfter(lastStatement, exportStatement),
    ];
};

const hasSpecifiers = (namedExport: TSESTree.ExportNamedDeclaration): boolean =>
    namedExport.specifiers.length > 0;

const isInlineDefaultExport = (
    defaultExport: TSESTree.ExportDefaultDeclaration,
    sourceCode: SourceCode
): boolean => {
    const { lines } = sourceCode;

    const { declaration } = defaultExport;
    const exportLine = lines.find((line) =>
        line.includes(sourceCode.getText(defaultExport))
    );
    const declarationLine = lines.find((line) =>
        line.includes(sourceCode.getText(declaration))
    );

    return (
        exportLine != null &&
        declarationLine != null &&
        lines.indexOf(exportLine) === lines.indexOf(declarationLine)
    );
};

export { noInlineExport };
