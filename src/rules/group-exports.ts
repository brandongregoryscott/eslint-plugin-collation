import { TSESTree } from "@typescript-eslint/utils";
import {
    RuleContext,
    RuleFix,
    RuleFixer,
} from "@typescript-eslint/utils/dist/ts-eslint";
import { RuleName } from "../enums/rule-name";
import { last, takeRight } from "../utils/core-utils";
import { createRule } from "../utils/rule-utils";

const groupExports = createRule({
    create: (context) => {
        const exports: TSESTree.ExportNamedDeclaration[] = [];

        return {
            ExportNamedDeclaration: (namedExport) => {
                exports.push(namedExport);
            },
            "Program:exit": () => {
                reportErrors(exports, context);
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description: "Consolidates multiple export statements",
            recommended: "warn",
        },
        fixable: "code",
        messages: {
            groupExports: "Expected export statement to be grouped",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.GroupExports,
});

const fixUngroupedExports = (
    fixer: RuleFixer,
    exports: TSESTree.ExportNamedDeclaration[]
): RuleFix[] => {
    const valueExports = getExportsByKind(exports, "value");
    const typeExports = getExportsByKind(exports, "type");

    return [
        ...getFixesForExports(fixer, valueExports),
        ...getFixesForExports(fixer, typeExports),
    ];
};

const getExportsByKind = (
    exports: TSESTree.ExportNamedDeclaration[],
    kind: TSESTree.ExportNamedDeclaration["exportKind"]
): TSESTree.ExportNamedDeclaration[] =>
    exports.filter((namedExport) => namedExport.exportKind === kind);

const getFixesForExports = (
    fixer: RuleFixer,
    exports: TSESTree.ExportNamedDeclaration[]
): RuleFix[] => {
    if (!hasMultipleExports(exports)) {
        return [];
    }

    const lastExport = last(exports)!;
    const extraExports = takeRight(exports, 1);
    const specifiers = getSpecifiers(lastExport).concat(
        extraExports.flatMap(getSpecifiers)
    );

    const exportKeyword =
        lastExport.exportKind === "type" ? "export type" : "export";

    return [
        ...extraExports.map((namedExport) => fixer.remove(namedExport)),
        fixer.replaceText(
            lastExport,
            `${exportKeyword} { ${specifiers.join(", ")} };`
        ),
    ];
};

const getSpecifiers = (
    namedExport: TSESTree.ExportNamedDeclaration
): string[] => namedExport.specifiers.map((specifier) => specifier.local.name);

const hasMultipleExports = (
    exports: TSESTree.ExportNamedDeclaration[]
): boolean => exports.length > 1;

const reportErrors = (
    exports: TSESTree.ExportNamedDeclaration[],
    context: RuleContext<"groupExports", never[]>
): void => {
    const valueExports = getExportsByKind(exports, "value");
    const typeExports = getExportsByKind(exports, "type");

    reportErrorsForExtraExports(exports, valueExports, context);
    reportErrorsForExtraExports(exports, typeExports, context);
};

/**
 * Reports errors for extra exports in the `typeOrValueExports` collection. The entire collection of
 * exports is needed for the fix to apply for both type AND value exports in one pass.
 */
const reportErrorsForExtraExports = (
    allExports: TSESTree.ExportNamedDeclaration[],
    typeOrValueExports: TSESTree.ExportNamedDeclaration[],
    context: RuleContext<"groupExports", never[]>
): void => {
    if (!hasMultipleExports(typeOrValueExports)) {
        return;
    }

    const extraExports = takeRight(typeOrValueExports, 1);
    extraExports.forEach((namedExport) => {
        context.report({
            node: namedExport,
            messageId: "groupExports",
            fix: (fixer) => fixUngroupedExports(fixer, allExports),
        });
    });
};

export { groupExports };
