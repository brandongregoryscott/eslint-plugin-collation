import {
    AST_NODE_TYPES,
    ESLintUtils,
    TSESTree,
} from "@typescript-eslint/utils";
import {
    RuleContext,
    RuleFix,
    RuleFixer,
    SourceCode,
} from "@typescript-eslint/utils/dist/ts-eslint";

type Declaration =
    | TSESTree.ClassDeclaration
    | TSESTree.TSEnumDeclaration
    | TSESTree.FunctionDeclaration
    | TSESTree.VariableDeclaration;

const declarations: Declaration[] = [];

const noDefaultExport = ESLintUtils.RuleCreator.withoutDocs({
    create(context) {
        return {
            ClassDeclaration: handleVisitDeclaration,
            TSEnumDeclaration: handleVisitDeclaration,
            FunctionDeclaration: handleVisitDeclaration,
            VariableDeclaration: handleVisitDeclaration,
            ExportDefaultDeclaration: (exportDefault) =>
                handleVisitExportDefaultDeclaration(exportDefault, context),
        };
    },
    meta: {
        docs: {
            description: "Enforces exports to be named",
            recommended: "warn",
        },
        fixable: "code",
        messages: {
            noDefaultExport: "Expected export to be named",
        },
        type: "suggestion",
        schema: [],
    },
    defaultOptions: [],
});

/**
 * Attempts to find the declaration statement associated with the given `Identifier`
 */
const findParentDeclaration = (
    identifier: TSESTree.Identifier
): Declaration | undefined =>
    declarations.find((node) => getDeclarationName(node) === identifier.name);

const fixDefaultExport = (
    fixer: RuleFixer,
    exportDefault: TSESTree.ExportDefaultDeclaration,
    sourceCode: SourceCode
): RuleFix | RuleFix[] => {
    const { declaration } = exportDefault;
    if (declaration.type === AST_NODE_TYPES.Identifier) {
        const parent = findParentDeclaration(declaration);
        if (parent == null) {
            return [];
        }

        return [
            fixer.insertTextBefore(parent, "export "),
            fixer.remove(exportDefault),
        ];
    }

    if (!isDeclaration(declaration)) {
        return [];
    }

    const nodeText = sourceCode.getText(declaration);
    return fixer.replaceText(exportDefault, `export ${nodeText}`);
};

const getDeclarationName = (declaration: Declaration): string | undefined => {
    switch (declaration.type) {
        case AST_NODE_TYPES.ClassDeclaration:
        case AST_NODE_TYPES.FunctionDeclaration:
        case AST_NODE_TYPES.TSEnumDeclaration:
            return declaration.id?.name;
        case AST_NODE_TYPES.VariableDeclaration:
            const declarator = declaration.declarations.find(
                (declarator) => declarator.id.type === AST_NODE_TYPES.Identifier
            );

            if (declarator == null) {
                return undefined;
            }

            return (declarator.id as TSESTree.Identifier).name;
        default:
            return undefined;
    }
};

const handleVisitDeclaration = (declaration: Declaration): void => {
    declarations.push(declaration);
};

const handleVisitExportDefaultDeclaration = (
    exportDefault: TSESTree.ExportDefaultDeclaration,
    context: RuleContext<"noDefaultExport", never[]>
): void => {
    const sourceCode = context.getSourceCode();

    context.report({
        node: exportDefault,
        messageId: "noDefaultExport",
        fix: (fixer) => fixDefaultExport(fixer, exportDefault, sourceCode),
    });
};

const isDeclaration = (node: TSESTree.Node): node is Declaration =>
    [
        AST_NODE_TYPES.ClassDeclaration,
        AST_NODE_TYPES.FunctionDeclaration,
        AST_NODE_TYPES.TSEnumDeclaration,
        AST_NODE_TYPES.VariableDeclaration,
    ].includes(node.type);

export { noDefaultExport };
