import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import {
    RuleContext,
    RuleFix,
    RuleFixer,
    SourceCode,
} from "@typescript-eslint/utils/dist/ts-eslint";
import { RuleName } from "../enums/rule-name";
import { Declaration } from "../types/declaration";
import { getName, isDeclaration } from "../utils/node-utils";
import { createRule } from "../utils/rule-utils";

const noDefaultExport = createRule({
    create: (context) => {
        const declarations: Declaration[] = [];

        return {
            ClassDeclaration: (classDeclaration) =>
                handleVisitDeclaration(classDeclaration, declarations),
            ExportDefaultDeclaration: (defaultExport) =>
                handleVisitExportDefaultDeclaration(
                    declarations,
                    defaultExport,
                    context
                ),
            FunctionDeclaration: (functionDeclaration) =>
                handleVisitDeclaration(functionDeclaration, declarations),
            TSEnumDeclaration: (enumDeclaration) =>
                handleVisitDeclaration(enumDeclaration, declarations),
            VariableDeclaration: (variableDeclaration) =>
                handleVisitDeclaration(variableDeclaration, declarations),
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description: "Enforces exports to be named",
            recommended: "warn",
        },
        fixable: "code",
        messages: {
            noDefaultExport: "Expected export to be named",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.NoDefaultExport,
});

/**
 * Attempts to find the declaration statement associated with the given `Identifier`
 */
const findParentDeclaration = (
    identifier: TSESTree.Identifier,
    declarations: Declaration[]
): Declaration | undefined =>
    declarations.find((node) => getName(node) === identifier.name);

const fixDefaultExport = (
    fixer: RuleFixer,
    declarations: Declaration[],
    defaultExport: TSESTree.ExportDefaultDeclaration,
    sourceCode: SourceCode
): RuleFix | RuleFix[] => {
    const { declaration } = defaultExport;
    if (declaration.type === AST_NODE_TYPES.Identifier) {
        const parent = findParentDeclaration(declaration, declarations);
        if (parent == null) {
            return [];
        }

        return [
            fixer.insertTextBefore(parent, "export "),
            fixer.remove(defaultExport),
        ];
    }

    if (!isDeclaration(declaration)) {
        return [];
    }

    const nodeText = sourceCode.getText(declaration);
    return fixer.replaceText(defaultExport, `export ${nodeText}`);
};

const handleVisitDeclaration = (
    declaration: Declaration,
    declarations: Declaration[]
): void => {
    declarations.push(declaration);
};

const handleVisitExportDefaultDeclaration = (
    declarations: Declaration[],
    exportDefault: TSESTree.ExportDefaultDeclaration,
    context: RuleContext<"noDefaultExport", never[]>
): void => {
    const sourceCode = context.getSourceCode();

    context.report({
        node: exportDefault,
        messageId: "noDefaultExport",
        fix: (fixer) =>
            fixDefaultExport(fixer, declarations, exportDefault, sourceCode),
    });
};

export { noDefaultExport };
