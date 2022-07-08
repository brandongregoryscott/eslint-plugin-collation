import type { TSESTree } from "@typescript-eslint/utils";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type {
    RuleFix,
    RuleFixer,
    SourceCode,
} from "@typescript-eslint/utils/dist/ts-eslint";
import { RuleName } from "../enums/rule-name";
import last from "lodash/last";
import { getName, isInlineExport } from "../utils/node-utils";
import { createRule } from "../utils/rule-utils";

const noInlineExport = createRule({
    create: (context) => {
        return {
            ExportDefaultDeclaration: (defaultExport): void => {
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
            ExportNamedDeclaration: (namedExport): void => {
                if (!isInlineExport(namedExport)) {
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
        | TSESTree.ExportDefaultDeclaration
        | TSESTree.ExportNamedDeclaration,
    sourceCode: SourceCode
): RuleFix | RuleFix[] => {
    const { declaration } = exportDeclaration;
    const isDefault =
        exportDeclaration.type === AST_NODE_TYPES.ExportDefaultDeclaration;
    const lastStatement = getLastStatement(exportDeclaration, sourceCode);

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

const getLastStatement = (
    exportDeclaration:
        | TSESTree.ExportDefaultDeclaration
        | TSESTree.ExportNamedDeclaration,
    sourceCode: SourceCode
): TSESTree.Node | undefined => {
    const lastStatementInFile = last(sourceCode.ast.body);
    const { parent } = exportDeclaration;
    if (parent?.type === AST_NODE_TYPES.TSModuleBlock) {
        return last(parent.body);
    }

    return lastStatementInFile;
};

export { noInlineExport };
