import type { RuleContext } from "@typescript-eslint/utils/dist/ts-eslint";
import { RuleName } from "../enums/rule-name";
import {
    isInlineExport,
    exportToString,
    toNamedExport,
} from "../utils/export-utils";
import { createRule } from "../utils/rule-utils";
import type { NamedExport } from "../types/named-export";

const sortExports = createRule({
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
                reportErrors(context, exports);
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description: "Sorts specifiers in an export statement",
            recommended: "warn",
        },
        fixable: "code",
        messages: {
            sortExports: "Expected exports to be sorted",
        },
        schema: [],
        type: "suggestion",
    },
    name: RuleName.SortExports,
});

const isSorted = (specifiers: string[]): boolean => {
    const expected = [...specifiers].sort();
    return JSON.stringify(expected) === JSON.stringify(specifiers);
};

const reportErrors = (
    context: RuleContext<"sortExports", never[]>,
    exports: NamedExport[]
): void => {
    exports.forEach((_export) => {
        if (isSorted(_export.specifiers)) {
            return;
        }

        const sortedSpecifiers = [..._export.specifiers].sort();
        context.report({
            messageId: "sortExports",
            node: _export.reference,
            fix: (fixer) =>
                fixer.replaceText(
                    _export.reference,
                    exportToString({ ..._export, specifiers: sortedSpecifiers })
                ),
        });
    });
};

export { sortExports };
