import type {
    RuleContext,
    RuleFix,
    RuleFixer,
    SourceCode,
} from "@typescript-eslint/utils/dist/ts-eslint";
import { RuleName } from "../enums/rule-name";
import last from "lodash/last";
import {
    isInlineExport,
    consolidateExports,
    exportToString,
    toNamedExport,
} from "../utils/export-utils";
import { createRule } from "../utils/rule-utils";
import dropRight from "lodash/dropRight";
import groupBy from "lodash/groupBy";
import { removeNodeAndNewLine } from "../utils/fixer-utils";
import type { NamedExport } from "../types/named-export";

const groupExports = createRule({
    create: (context) => {
        const exports: NamedExport[] = [];

        return {
            ExportNamedDeclaration: (_export): void => {
                if (isInlineExport(_export)) {
                    return;
                }

                exports.push(toNamedExport(_export));
            },
            "Program:exit": (): void => {
                const groupedExports = groupExportsByTypeAndModule(exports);
                reportErrors(context, groupedExports);
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
    exports: Record<string, NamedExport[]>,
    sourceCode: SourceCode
): RuleFix[] => {
    const fixes = Object.values(exports).flatMap((exports) =>
        getFixesForExports(fixer, exports, sourceCode)
    );

    return fixes;
};

const getFixesForExports = (
    fixer: RuleFixer,
    exports: NamedExport[],
    sourceCode: SourceCode
): RuleFix[] => {
    const lastExport = last(exports);
    if (exports.length < 2 || lastExport == null) {
        return [];
    }

    const consolidatedExport = consolidateExports(exports);
    return [
        fixer.insertTextAfter(
            lastExport.reference,
            exportToString(consolidatedExport)
        ),
        ...exports.flatMap((_export, index) =>
            index === exports.length - 1
                ? fixer.remove(_export.reference)
                : removeNodeAndNewLine(fixer, _export.reference, sourceCode)
        ),
    ];
};

/**
 * Group exports by kind (type or value) as well as the module they are exported from
 *  ny groups that contain more than 1 export will have their specifiers consolidated into one
 */
const groupExportsByTypeAndModule = (
    exports: NamedExport[]
): Record<string, NamedExport[]> =>
    groupBy(exports, (_export) => [_export.kind, _export.module].join());

const reportErrorsForExtraExports = (
    context: RuleContext<"groupExports", never[]>,
    exports: NamedExport[],
    groupedExports: Record<string, NamedExport[]>
): void => {
    const sourceCode = context.getSourceCode();
    const extraExports = dropRight(exports, 1);
    extraExports.forEach((_export) => {
        context.report({
            node: _export.reference,
            messageId: "groupExports",
            fix: (fixer) =>
                fixUngroupedExports(fixer, groupedExports, sourceCode),
        });
    });
};

const reportErrors = (
    context: RuleContext<"groupExports", never[]>,
    groupedExports: Record<string, NamedExport[]>
): void => {
    Object.values(groupedExports).forEach((exports) =>
        reportErrorsForExtraExports(context, exports, groupedExports)
    );
};

export { groupExports };
